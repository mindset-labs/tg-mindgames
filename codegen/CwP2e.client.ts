/**
* This file was automatically generated by @cosmwasm/ts-codegen@1.11.1.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @cosmwasm/ts-codegen generate command to regenerate this file.
*/

import { CosmWasmClient, SigningCosmWasmClient, ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { Coin, StdFee } from "@cosmjs/amino";
import { Uint128, Logo, EmbeddedLogo, Binary, InstantiateMsg, Cw20Coin, InstantiateMarketingInfo, MinterResponse, ExecuteMsg, Expiration, Timestamp, Uint64, QueryMsg, Addr, AllAccountsResponse, AllAllowancesResponse, AllowanceInfo, AllowanceResponse, AvailableBalanceResponse, BalanceResponse, DownloadLogoResponse, LogoInfo, MarketingInfoResponse, RewardResponse, StakedBalanceResponse, TokenInfoResponse } from "./CwP2e.types";
export interface CwP2eReadOnlyInterface {
  contractAddress: string;
  balance: ({
    address
  }: {
    address: string;
  }) => Promise<BalanceResponse>;
  tokenInfo: () => Promise<TokenInfoResponse>;
  allowance: ({
    owner,
    spender
  }: {
    owner: string;
    spender: string;
  }) => Promise<AllowanceResponse>;
  minter: () => Promise<MinterResponse>;
  marketingInfo: () => Promise<MarketingInfoResponse>;
  downloadLogo: () => Promise<DownloadLogoResponse>;
  allAllowances: ({
    limit,
    owner,
    startAfter
  }: {
    limit?: number;
    owner: string;
    startAfter?: string;
  }) => Promise<AllAllowancesResponse>;
  allAccounts: ({
    limit,
    startAfter
  }: {
    limit?: number;
    startAfter?: string;
  }) => Promise<AllAccountsResponse>;
  stakedBalance: ({
    address
  }: {
    address: Addr;
  }) => Promise<StakedBalanceResponse>;
  reward: ({
    address
  }: {
    address: Addr;
  }) => Promise<RewardResponse>;
  availableBalance: ({
    address
  }: {
    address: Addr;
  }) => Promise<AvailableBalanceResponse>;
}
export class CwP2eQueryClient implements CwP2eReadOnlyInterface {
  client: CosmWasmClient;
  contractAddress: string;
  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client;
    this.contractAddress = contractAddress;
    this.balance = this.balance.bind(this);
    this.tokenInfo = this.tokenInfo.bind(this);
    this.allowance = this.allowance.bind(this);
    this.minter = this.minter.bind(this);
    this.marketingInfo = this.marketingInfo.bind(this);
    this.downloadLogo = this.downloadLogo.bind(this);
    this.allAllowances = this.allAllowances.bind(this);
    this.allAccounts = this.allAccounts.bind(this);
    this.stakedBalance = this.stakedBalance.bind(this);
    this.reward = this.reward.bind(this);
    this.availableBalance = this.availableBalance.bind(this);
  }
  balance = async ({
    address
  }: {
    address: string;
  }): Promise<BalanceResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      balance: {
        address
      }
    });
  };
  tokenInfo = async (): Promise<TokenInfoResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      token_info: {}
    });
  };
  allowance = async ({
    owner,
    spender
  }: {
    owner: string;
    spender: string;
  }): Promise<AllowanceResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      allowance: {
        owner,
        spender
      }
    });
  };
  minter = async (): Promise<MinterResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      minter: {}
    });
  };
  marketingInfo = async (): Promise<MarketingInfoResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      marketing_info: {}
    });
  };
  downloadLogo = async (): Promise<DownloadLogoResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      download_logo: {}
    });
  };
  allAllowances = async ({
    limit,
    owner,
    startAfter
  }: {
    limit?: number;
    owner: string;
    startAfter?: string;
  }): Promise<AllAllowancesResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      all_allowances: {
        limit,
        owner,
        start_after: startAfter
      }
    });
  };
  allAccounts = async ({
    limit,
    startAfter
  }: {
    limit?: number;
    startAfter?: string;
  }): Promise<AllAccountsResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      all_accounts: {
        limit,
        start_after: startAfter
      }
    });
  };
  stakedBalance = async ({
    address
  }: {
    address: Addr;
  }): Promise<StakedBalanceResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      staked_balance: {
        address
      }
    });
  };
  reward = async ({
    address
  }: {
    address: Addr;
  }): Promise<RewardResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      reward: {
        address
      }
    });
  };
  availableBalance = async ({
    address
  }: {
    address: Addr;
  }): Promise<AvailableBalanceResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      available_balance: {
        address
      }
    });
  };
}
export interface CwP2eInterface extends CwP2eReadOnlyInterface {
  contractAddress: string;
  sender: string;
  transfer: ({
    amount,
    recipient
  }: {
    amount: Uint128;
    recipient: string;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  burn: ({
    amount
  }: {
    amount: Uint128;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  send: ({
    amount,
    contract,
    msg
  }: {
    amount: Uint128;
    contract: string;
    msg: Binary;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  increaseAllowance: ({
    amount,
    expires,
    spender
  }: {
    amount: Uint128;
    expires?: Expiration;
    spender: string;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  decreaseAllowance: ({
    amount,
    expires,
    spender
  }: {
    amount: Uint128;
    expires?: Expiration;
    spender: string;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  transferFrom: ({
    amount,
    owner,
    recipient
  }: {
    amount: Uint128;
    owner: string;
    recipient: string;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  burnFrom: ({
    amount,
    owner
  }: {
    amount: Uint128;
    owner: string;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  sendFrom: ({
    amount,
    contract,
    msg,
    owner
  }: {
    amount: Uint128;
    contract: string;
    msg: Binary;
    owner: string;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  updateMarketing: ({
    description,
    marketing,
    project
  }: {
    description?: string;
    marketing?: string;
    project?: string;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  uploadLogo: (logo: Logo, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  stake: ({
    amount
  }: {
    amount: Uint128;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  unstake: ({
    amount
  }: {
    amount: Uint128;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  claimRewards: (fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  unlock: (fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  authorizeRewardsIssuer: ({
    address
  }: {
    address: string;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  mintRewards: ({
    amount,
    recipient
  }: {
    amount: Uint128;
    recipient: string;
  }, fee?: number | StdFee | "auto", memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
}
export class CwP2eClient extends CwP2eQueryClient implements CwP2eInterface {
  client: SigningCosmWasmClient;
  sender: string;
  contractAddress: string;
  constructor(client: SigningCosmWasmClient, sender: string, contractAddress: string) {
    super(client, contractAddress);
    this.client = client;
    this.sender = sender;
    this.contractAddress = contractAddress;
    this.transfer = this.transfer.bind(this);
    this.burn = this.burn.bind(this);
    this.send = this.send.bind(this);
    this.increaseAllowance = this.increaseAllowance.bind(this);
    this.decreaseAllowance = this.decreaseAllowance.bind(this);
    this.transferFrom = this.transferFrom.bind(this);
    this.burnFrom = this.burnFrom.bind(this);
    this.sendFrom = this.sendFrom.bind(this);
    this.updateMarketing = this.updateMarketing.bind(this);
    this.uploadLogo = this.uploadLogo.bind(this);
    this.stake = this.stake.bind(this);
    this.unstake = this.unstake.bind(this);
    this.claimRewards = this.claimRewards.bind(this);
    this.unlock = this.unlock.bind(this);
    this.authorizeRewardsIssuer = this.authorizeRewardsIssuer.bind(this);
    this.mintRewards = this.mintRewards.bind(this);
  }
  transfer = async ({
    amount,
    recipient
  }: {
    amount: Uint128;
    recipient: string;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      transfer: {
        amount,
        recipient
      }
    }, fee, memo, _funds);
  };
  burn = async ({
    amount
  }: {
    amount: Uint128;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      burn: {
        amount
      }
    }, fee, memo, _funds);
  };
  send = async ({
    amount,
    contract,
    msg
  }: {
    amount: Uint128;
    contract: string;
    msg: Binary;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      send: {
        amount,
        contract,
        msg
      }
    }, fee, memo, _funds);
  };
  increaseAllowance = async ({
    amount,
    expires,
    spender
  }: {
    amount: Uint128;
    expires?: Expiration;
    spender: string;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      increase_allowance: {
        amount,
        expires,
        spender
      }
    }, fee, memo, _funds);
  };
  decreaseAllowance = async ({
    amount,
    expires,
    spender
  }: {
    amount: Uint128;
    expires?: Expiration;
    spender: string;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      decrease_allowance: {
        amount,
        expires,
        spender
      }
    }, fee, memo, _funds);
  };
  transferFrom = async ({
    amount,
    owner,
    recipient
  }: {
    amount: Uint128;
    owner: string;
    recipient: string;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      transfer_from: {
        amount,
        owner,
        recipient
      }
    }, fee, memo, _funds);
  };
  burnFrom = async ({
    amount,
    owner
  }: {
    amount: Uint128;
    owner: string;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      burn_from: {
        amount,
        owner
      }
    }, fee, memo, _funds);
  };
  sendFrom = async ({
    amount,
    contract,
    msg,
    owner
  }: {
    amount: Uint128;
    contract: string;
    msg: Binary;
    owner: string;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      send_from: {
        amount,
        contract,
        msg,
        owner
      }
    }, fee, memo, _funds);
  };
  updateMarketing = async ({
    description,
    marketing,
    project
  }: {
    description?: string;
    marketing?: string;
    project?: string;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      update_marketing: {
        description,
        marketing,
        project
      }
    }, fee, memo, _funds);
  };
  uploadLogo = async (logo: Logo, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      upload_logo: logo
    }, fee, memo, _funds);
  };
  stake = async ({
    amount
  }: {
    amount: Uint128;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      stake: {
        amount
      }
    }, fee, memo, _funds);
  };
  unstake = async ({
    amount
  }: {
    amount: Uint128;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      unstake: {
        amount
      }
    }, fee, memo, _funds);
  };
  claimRewards = async (fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      claim_rewards: {}
    }, fee, memo, _funds);
  };
  unlock = async (fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      unlock: {}
    }, fee, memo, _funds);
  };
  authorizeRewardsIssuer = async ({
    address
  }: {
    address: string;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      authorize_rewards_issuer: {
        address
      }
    }, fee, memo, _funds);
  };
  mintRewards = async ({
    amount,
    recipient
  }: {
    amount: Uint128;
    recipient: string;
  }, fee: number | StdFee | "auto" = "auto", memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      mint_rewards: {
        amount,
        recipient
      }
    }, fee, memo, _funds);
  };
}