import Client from '@hgraph.io/sdk'

// Authenticate with an API key or a token

// Replace with your API key
const client = new Client({
  headers: {
    'x-api-key': '<your-api-key>',
  },
})

// Replace with your token
// const client = new Client({
//   token: '<your-token>',
// })

const container = document.getElementById('root')

function appendToDocument(data) {
  container.innerHTML =
    container.innerHTML + `<br/><pre>${JSON.stringify(data)}</pre>`
}

const LatestTransaction = `
query LatestTransaction {
  transaction(limit: 1, order_by: {consensus_timestamp: desc}) {
    consensus_timestamp
  }
}`

const LatestTransactionSubscription = LatestTransaction.trim().replace(
  'query',
  'subscription'
)

async function main() {
  const json = await client.query(LatestTransaction)

  appendToDocument(json)
  const subscription = client.subscribe(LatestTransactionSubscription, {
    // handle the data
    next: (data) => {
      appendToDocument(data)
      console.log(data)
    },
    error: (e) => {
      console.error(e)
    },
    complete: () => {
      console.log('Optionally do some cleanup')
      appendToDocument('Unsubscribed from GraphQL subscription')
    },
  })

  // clear subscription
  setTimeout(subscription.unsubscribe, 10000)
}

main()
