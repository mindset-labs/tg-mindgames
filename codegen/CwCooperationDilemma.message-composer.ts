/**
* This file was automatically generated by @cosmwasm/ts-codegen@1.11.1.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @cosmwasm/ts-codegen generate command to regenerate this file.
*/

import { Coin } from "@cosmjs/amino";
import { MsgExecuteContractEncodeObject } from "@cosmjs/cosmwasm-stargate";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { toUtf8 } from "@cosmjs/encoding";
import { Addr, InstantiateMsg, ExecuteMsg, ExecuteMsg1, Uint128, GameConfig, QueryMsg, GameRoundStatus, GameRound, GameStatus, Game, Uint64, Leaderboard } from "./CwCooperationDilemma.types";
export interface CwCooperationDilemmaMsg {
  contractAddress: string;
  sender: string;
  lifecycle: (executeMsg: ExecuteMsg, _funds?: Coin[]) => MsgExecuteContractEncodeObject;
}
export class CwCooperationDilemmaMsgComposer implements CwCooperationDilemmaMsg {
  sender: string;
  contractAddress: string;
  constructor(sender: string, contractAddress: string) {
    this.sender = sender;
    this.contractAddress = contractAddress;
    this.lifecycle = this.lifecycle.bind(this);
  }
  lifecycle = (executeMsg: ExecuteMsg, _funds?: Coin[]): MsgExecuteContractEncodeObject => {
    return {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: this.sender,
        contract: this.contractAddress,
        msg: toUtf8(JSON.stringify({
          lifecycle: executeMsg
        })),
        funds: _funds
      })
    };
  };
}