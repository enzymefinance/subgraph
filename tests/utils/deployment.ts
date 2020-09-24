import request, { gql } from 'graphql-request';

export interface Deployment {
  wethToken: string;
  mlnToken: string;
  chaiPriceSource: string;
  chaiIntegratee: string;
  kyberIntegratee: string;
  dispatcher: string;
  vaultLib: string;
  fundDeployer: string;
  valueInterpreter: string;
  engine: string;
  comptrollerLib: string;
  feeManager: string;
  integrationManager: string;
  policyManager: string;
  chainlinkPriceFeed: string;
  chaiPriceFeed: string;
  aggregatedDerivativePriceFeed: string;
  chaiAdapter: string;
  kyberAdapter: string;
  managementFee: string;
  performanceFee: string;
  adapterBlacklist: string;
  adapterWhitelist: string;
  assetBlacklist: string;
  assetWhitelist: string;
  maxConcentration: string;
  userWhitelist: string;
}

const deploymentQuery = gql`
  query {
    deployment {
      wethToken
      mlnToken
      chaiPriceSource
      chaiIntegratee
      kyberIntegratee
      dispatcher
      vaultLib
      fundDeployer
      valueInterpreter
      engine
      comptrollerLib
      feeManager
      integrationManager
      policyManager
      chainlinkPriceFeed
      chaiPriceFeed
      aggregatedDerivativePriceFeed
      chaiAdapter
      kyberAdapter
      managementFee
      performanceFee
      adapterBlacklist
      adapterWhitelist
      assetBlacklist
      assetWhitelist
      maxConcentration
      userWhitelist
    }
  }
`;

const createDeploymentMutation = gql`
  mutation {
    createDeployment {
      wethToken
      mlnToken
      chaiPriceSource
      chaiIntegratee
      kyberIntegratee
      dispatcher
      vaultLib
      fundDeployer
      valueInterpreter
      engine
      comptrollerLib
      feeManager
      integrationManager
      policyManager
      chainlinkPriceFeed
      chaiPriceFeed
      aggregatedDerivativePriceFeed
      chaiAdapter
      kyberAdapter
      managementFee
      performanceFee
      adapterBlacklist
      adapterWhitelist
      assetBlacklist
      assetWhitelist
      maxConcentration
      userWhitelist
    }
  }
`;

export async function fetchDeployment(endpoint: string) {
  const result = await request<{
    deployment: Deployment;
  }>(endpoint, deploymentQuery);

  return result.deployment;
}

export async function createDeployment(endpoint: string) {
  const result = await request<{ createDeployment: Deployment }>(endpoint, createDeploymentMutation);

  return result.createDeployment;
}

export interface Account {
  address: string;
  mnemonic: string;
  publicKey: string;
  privateKey: string;
}

const createAccountMutation = gql`
  mutation {
    account: createWallet {
      address
      mnemonic
      publicKey
      privateKey
    }
  }
`;

export async function createAccount(endpoint: string) {
  const result = await request<{
    account: Account;
  }>(endpoint, createAccountMutation);

  return result.account;
}
