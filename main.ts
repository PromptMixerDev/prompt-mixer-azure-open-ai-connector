import { AzureOpenAI } from 'openai';
import type { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources';

import * as fs from 'node:fs';
import * as utils from 'node:util';

import { config } from './config.js';
import { DefaultAzureCredential } from '@azure/identity';
import { CognitiveServicesManagementClient } from '@azure/arm-cognitiveservices';

const AZURE_API_KEY = 'AZURE_API_KEY';
const ENDPOINT = 'ENDPOINT';

interface ConnectorResponse {
  Completions: Completion[];
  ModelType: string;
}

interface ErrorCompletion {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error: string;
  model: string;
  usage: undefined;
}

interface Completion {
  Content: string | null;
  TokenUsage?: number;
  Error?: string;
}

type Completions = ChatCompletion | ErrorCompletion;

export interface ConnectorSetting {
  SettingID: string;
  Name: string;
  Value?: string;
  Type: string;
}

async function getDynamicModelList(
  settings: ConnectorSetting[],
): Promise<string[]> {
  const accountName = settings.find((x) => x.SettingID === 'ACCOUNT_NAME')
    ?.Value as string;
  const resourceGroupName = settings.find(
    (x) => x.SettingID === 'RESOURCE_GROUPNAME',
  )?.Value as string;
  const subscriptionId = settings.find((x) => x.SettingID === 'SUBSCRIPTION_ID')
    ?.Value as string;

  const credential = new DefaultAzureCredential();
  const client = new CognitiveServicesManagementClient(
    credential,
    subscriptionId,
  );
  const deploymentNames = [];

  try {
    logger('Fetching available models...', 'Status');
    for await (const item of client.deployments.list(
      resourceGroupName,
      accountName,
    )) {
      if (item?.name) {
        deploymentNames.push(item.name);
        logger(`Found model deployment: ${item.name}`, 'Status');
      }
    }

    logger(`Retrieved ${deploymentNames.length} model deployments`, 'Status');
    return deploymentNames;
  } catch (error) {
    console.error('Error in getDynamicModelList function:', error);
    logger('Falling back to default models from config', 'Status');
    return config.models;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isError(output: any): output is ErrorCompletion {
  return (output as ErrorCompletion).error !== undefined;
}

const mapToResponse = (
  outputs: Array<Completions>,
  model: string,
): ConnectorResponse => {
  return {
    Completions: outputs.map((output) => {
      if ('error' in output) {
        return {
          Content: null,
          TokenUsage: undefined,
          Error: output.error
        };
      } else {
        return {
          Content: output.choices[0]?.message?.content,
          TokenUsage: output.usage?.total_tokens
        };
      }
    }),
    ModelType: outputs[0]?.model || model,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapErrorToCompletion = (error: any, model: string): ErrorCompletion => {
  const errorMessage = error.message || JSON.stringify(error);

  return {
    choices: [],
    error: errorMessage,
    model,
    usage: undefined,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logger = (logBody: any, description?: string): void => {
  if (description) console.log(`${description}`);

  console.log(
    utils.inspect(logBody, {
      showHidden: false,
      depth: null,
      colors: true,
    }),
  );
};

async function main(
  model: string,
  prompts: string[],
  properties: Record<string, unknown>,
  settings: Record<string, unknown>,
) {
  const endpoint = settings?.[ENDPOINT] as string;
  const azureApiKey = settings?.[AZURE_API_KEY] as string;
  const deploymentId = model;

  const client = new AzureOpenAI({
    apiKey: azureApiKey,
    endpoint: endpoint,
    deployment: deploymentId,
    apiVersion: "2024-08-01-preview",
  });

  const total = prompts.length;
  const { prompt, ...restProperties } = properties;
  const systemPrompt = (prompt ||
    config.properties.find((prop: { id: string }) => prop.id === 'prompt')?.value) as string;
  const messageHistory: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt }
  ];

  const outputs: Array<Completions> = [];

  try {
    for (let index = 0; index < total; index++) {
      try {
        const userPrompt = prompts[index];
        logger(userPrompt);
        const imageUrls = extractImageUrls(userPrompt);

        const content: { type: 'text', text: string }[] = [{
          type: 'text',
          text: userPrompt
        }];

        for (const imageUrl of imageUrls) {
          if (imageUrl.startsWith('http')) {
            content.push({
              type: 'text',
              text: imageUrl
            });
          } else {
            const base64Image = encodeImage(imageUrl);
            content.push({
              type: 'text',
              text: `data:image/jpeg;base64,${base64Image}`
            });
          }
        }

        messageHistory.push({ role: 'user', content: userPrompt });
        logger(messageHistory);

        const chatCompletion = await client.chat.completions.create({
          messages: messageHistory,
          model: deploymentId,
          ...restProperties,
        });
        logger(chatCompletion);

        outputs.push(chatCompletion);
        const assistantResponse =
          chatCompletion.choices[0]?.message?.content || 'No response.';

        messageHistory.push({
          role: 'assistant',
          content: assistantResponse,
        });

        logger(chatCompletion, `Response to prompt ${index + 1} of ${total}:`);
      } catch (error) {
        const completionWithError = mapErrorToCompletion(error, model);
        outputs.push(completionWithError);
        logger('Error in chat completion:', error);
      }
    }

    return mapToResponse(outputs, model);
  } catch (error) {
    console.error('Error in main function:', error);
    return { Error: error, ModelType: model };
  }
}

function encodeImage(imagePath: string): string {
  const imageBuffer = fs.readFileSync(imagePath);
  return Buffer.from(imageBuffer).toString('base64');
}

function extractImageUrls(prompt: string): string[] {
  const imageExtensions = ['.png', '.jpeg', '.jpg', '.webp', '.gif'];
  // Updated regex to match both http and local file paths
  const urlRegex =
    /(https?:\/\/[^\s]+|[a-zA-Z]:\\[^:<>"|?\n]*|\/[^:<>"|?\n]*)/g;
  const urls = prompt.match(urlRegex) || [];

  return urls.filter((url) => {
    const extensionIndex = url.lastIndexOf('.');
    if (extensionIndex === -1) {
      // If no extension found, return false.
      return false;
    }
    const extension = url.slice(extensionIndex);
    return imageExtensions.includes(extension.toLowerCase());
  });
}

export { main, config, getDynamicModelList };
