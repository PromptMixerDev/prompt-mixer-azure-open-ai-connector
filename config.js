export const config = {
  connectorName: 'AzureOpenAI',
  connectorVersion: '1.0.0',
  models: [],
  description:
    'The Azure OpenAI Connector utilizes the capabilities of sophisticated AI models offered by OpenAI, like GPT.',
  author: 'Prompt Mixer',
  properties: [
    {
      id: 'prompt',
      name: 'System Prompt',
      value: 'You are a helpful assistant.',
      type: 'string',
    },
    {
      id: 'max_tokens',
      name: 'Max Tokens',
      value: 4096,
      type: 'number',
    },
    {
      id: 'temperature',
      name: 'Temperature',
      value: 0.7,
      type: 'number',
    },
    {
      id: 'top_p',
      name: 'Top P',
      value: 1,
      type: 'number',
    },
    {
      id: 'frequency_penalty',
      name: 'Frequency Penalty',
      value: 0.5,
      type: 'number',
    },
    {
      id: 'presence_penalty',
      name: 'Presence Penalty',
      value: 0.5,
      type: 'number',
    },
    {
      id: 'stop',
      name: 'Stop Sequences',
      value: ['\n'],
      type: 'array',
    },
    {
      id: 'echo',
      name: 'Echo',
      value: false,
      type: 'boolean',
    },
    {
      id: 'best_of',
      name: 'Best Of',
      value: 1,
      type: 'number',
    },
    {
      id: 'logprobs',
      name: 'LogProbs',
      value: false,
      type: 'boolean',
    },
  ],
  settings: [
    {
      id: 'AZURE_API_KEY',
      name: 'Azure API Key',
      value: '',
      type: 'string',
    },
    {
      id: 'ENDPOINT',
      name: 'Endpoint',
      value: '',
      type: 'string',
    },
    {
      id: 'ACCOUNT_NAME',
      name: 'Account Name',
      value: '',
      type: 'string',
    },
    {
      id: 'RESOURCE_GROUPNAME',
      name: 'Resource GroupName',
      value: '',
      type: 'string',
    },
    {
      id: 'SUBSCRIPTION_ID',
      name: 'Subscription Id',
      value: '',
      type: 'string',
    },
  ],
  iconBase64:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAACG0lEQVR4nM2RS0zSARzH6TX483SF6+GlQ2WKDxAREi5ey16UIq4ilTCb1cq2aOtal9zKImkSJVPzgYiIARWZA6eTWoeiU1sBRqD4Cu3E49usVWtGdmp9t9/pt8/n991+JNJ/mbTd13p3XOmH5PkiJJ5FiMcXIB5d6P0rmF7ayE7beyPGll2HeCyK4tEoikeiELnnYxJXNH1FAetAs4q1/xaYexrB7XyDXa5PEA3PQzQ0B+HTuRMrChhSrZMp1YJ1sBlbLxmXIAidsyh6PAuBY+bJn+uX6dMZZXdjjMM6MA+1YH2FFkWO6aTAPgOBbRr8wUhcaAlvTC2QG07RZa1gyO6DUa4HXarxFD6MjBdaI+BbIijonwK/b7IupYBa2fGMVtkOurwN9AoDaDLDeb450lBgngLPNAmeMQxuT3jo97CiZxP1aFecdqQLxPE+EFWm5JozrtINVz37uN2hJLc7hPzOEPI7ggneA/+WZQJCYTpNKEygKoxYVz8Mktr7bRpeYJvGi7z2j8hrCyLX8AE594L1ywTkGoubqLaAqDJ/bbD67NjAdwn7shu5rUvgBHL0E+DoAq5f66vsm8lKW4KiHASlxgpK9UCCOGbNIKlfnSRdfJ1Ye24EHJ0fnJYAsu/4ka31JbZrAxk/r9c5S8i1j+LkWgfIKjvISpvtx1Ltla+68PJz5s23yLrtQ5bGh51N7+KZTe9LUn7jn+YLOFcSauEKTMYAAAAASUVORK5CYII=',
};
