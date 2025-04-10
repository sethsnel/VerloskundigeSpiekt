import {
  SearchClient,
  SearchIndexClient,
  AzureKeyCredential,
  SearchIndex,
} from '@azure/search-documents'

import { SearchableNote } from './search-schema'

// These should come from environment variables
const endpoint = process.env.AZURE_SEARCH_ENDPOINT
const apiKey = process.env.AZURE_SEARCH_API_KEY
const indexName = process.env.AZURE_SEARCH_INDEX_NAME || 'notes'

if (!endpoint) {
  throw new Error('NEXT_PUBLIC_AZURE_SEARCH_ENDPOINT environment variable is not set')
}

if (!apiKey) {
  throw new Error('NEXT_PUBLIC_AZURE_SEARCH_API_KEY environment variable is not set')
}

// Search index schema definition
export const searchIndexSchema: SearchIndex = {
  name: indexName,
  corsOptions: {
    allowedOrigins: ['*'],
  },
  fields: [
    {
      name: 'id',
      type: 'Edm.String',
      key: true,
      searchable: false,
      filterable: true,
    },
    {
      name: 'name',
      type: 'Edm.String',
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      name: 'content',
      type: 'Edm.String',
      searchable: true,
      filterable: false,
    },
    {
      name: 'articleId',
      type: 'Edm.String',
      searchable: false,
      filterable: true,
      sortable: true,
    },
    {
      name: 'articleName',
      type: 'Edm.String',
      searchable: true,
      filterable: true,
      sortable: true,
    },
    {
      name: 'tagIds',
      type: 'Collection(Edm.String)',
      searchable: false,
      filterable: true,
      facetable: true,
    },
  ],
}

// Create search clients
const credential = new AzureKeyCredential(apiKey)

export const searchClient = new SearchClient<SearchableNote>(endpoint, indexName, credential)

export const adminClient = new SearchIndexClient(endpoint, credential)
