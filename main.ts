import {
  OpenAIClient,
  AzureKeyCredential,
  ChatCompletions,
  ChatRequestMessageUnion,
  ChatRequestUserMessage,
  ChatMessageImageContentItem,
  ChatMessageTextContentItem,
  ChatRequestAssistantMessage,
} from '@azure/openai';

import * as fs from 'node:fs';
import * as utils from 'node:util';

import { config } from './config.js';

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

type Completions = ChatCompletions | ErrorCompletion;

function isError(output: any): output is ErrorCompletion {
  return (output as ErrorCompletion).error !== undefined;
}

const mapToResponse = (
  outputs: Array<Completions>,
  model: string,
): ConnectorResponse => {
  const map = {
    error: (output: ErrorCompletion): Completion => ({
      Content: null,
      TokenUsage: undefined,
      Error: output.error,
    }),
    success: (output: ChatCompletions): Completion => ({
      Content: output.choices[0]?.message?.content as string,
      TokenUsage: output.usage?.totalTokens,
    }),
  };

  return {
    Completions: outputs.map((output) => {
      if (isError(output)) {
        return map['error'](output);
      }

      return map['success'](output);
    }),
    ModelType: model,
  };
};

const mapErrorToCompletion = (error: any, model: string): ErrorCompletion => {
  const errorMessage = error.message || JSON.stringify(error);

  return {
    choices: [],
    error: errorMessage,
    model,
    usage: undefined,
  };
};

const logger = (object: any, description?: string): void => {
  if (description) console.log(`${description}`);

  console.log(
    utils.inspect(object, {
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

  const client = new OpenAIClient(
    endpoint,
    new AzureKeyCredential(azureApiKey),
  );

  const total = prompts.length;
  const { prompt, ...restProperties } = properties;
  const systemPrompt = (prompt ||
    config.properties.find((prop) => prop.id === 'prompt')?.value) as string;
  const messageHistory: (
    | ChatRequestMessageUnion
    | ChatRequestUserMessage
    | ChatRequestAssistantMessage
  )[] = [{ role: 'system', content: systemPrompt }];

  const outputs: Array<Completions> = [];

  const getChatCompletions = async (
    messageContent: ChatRequestMessageUnion[],
  ): Promise<Completions[]> => {
    try {
      const chatCompletion = await client.getChatCompletions(
        deploymentId,
        messageContent,
        restProperties,
      );
      outputs.push(chatCompletion);
    } catch (error) {
      const completionWithError = mapErrorToCompletion(error, model);
      outputs.push(completionWithError);
    }

    return outputs;
  };

  try {
    for (let index = 0; index < total; index++) {
      const userPrompt = prompts[index];
      logger(userPrompt);
      const imageUrls = extractImageUrls(userPrompt);

      const messageContent: Array<
        ChatMessageTextContentItem | ChatMessageImageContentItem
      > = [
        {
          type: 'text',
          text: userPrompt,
        },
      ];

      for (const imageUrl of imageUrls) {
        if (imageUrl.startsWith('http')) {
          messageContent.push({
            type: 'image_url',
            imageUrl: {
              url: imageUrl,
            },
          });
        } else {
          const base64Image = encodeImage(imageUrl);
          messageContent.push({
            type: 'image_url',
            imageUrl: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          });
        }
      }

      messageHistory.push({ role: 'user', content: messageContent });
      logger(messageHistory);

      const chatCompletion = (await getChatCompletions(
        messageHistory,
      )) as ChatCompletions[];
      logger(chatCompletion);

      outputs.push(chatCompletion[0]);
      const assistantResponse =
        chatCompletion[0].choices[0]?.message?.content || 'No response.';

      messageHistory.push({
        role: 'assistant',
        content: assistantResponse,
      });

      logger(chatCompletion, `Response to prompt ${index + 1} of ${total}:`);
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

export { main, config };
