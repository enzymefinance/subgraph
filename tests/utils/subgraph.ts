import request, { gql } from 'graphql-request';

interface Block {
  number: string;
  hash: string;
}

export interface SubgraphIndexingStatus {
  subgraph: string;
  synced: boolean;
  chains: {
    network: string;
    latestBlock: Block;
    chainHeadBlock: Block;
  }[];
}

const statusQuery = gql`
  query SubgraphStatus($name: String!) {
    indexingStatusForCurrentVersion(subgraphName: $name) {
      subgraph
      synced
      chains {
        network
        latestBlock {
          number
        }
        chainHeadBlock {
          number
        }
      }
    }
  }
`;

export async function getSubgraphIndexingStatus(endpoint: string) {
  const result = await request<{
    indexingStatusForCurrentVersion: SubgraphIndexingStatus;
  }>(endpoint, statusQuery, {
    name: 'melonproject/melon',
  });

  return result.indexingStatusForCurrentVersion;
}

export async function waitForSubgraph(endpoint: string, block: number) {
  const status = await getSubgraphIndexingStatus(endpoint);
  const syncedBlock = parseInt(status.chains[0].latestBlock.number, 10);

  if (syncedBlock === block) {
    return status;
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
  await waitForSubgraph(endpoint, block);
}
