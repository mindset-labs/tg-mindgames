use cosmwasm_schema::cw_serde;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cosmwasm_std::{to_json_binary, Addr, Binary, CosmosMsg, StdResult, Uint128, WasmMsg};
use cw_storage_plus::{Item, Map};

pub const OWNER: Item<String> = Item::new("owner");
pub const NAME: Item<String> = Item::new("name");
pub const GAMES: Map<Uint128, Game> = Item::new("games");


// pub const SYMBOL: Item<String> = Item::new("symbol");
// pub const BASE_TOKEN_URI: Item<String> = Item::new("base_token_uri");
// pub const DECIMALS: Item<u8> = Item::new("decimals");
// pub const TOTAL_SUPPLY: Item<Uint128> = Item::new("total_supply");
// pub const MINTED: Item<Uint128> = Item::new("minted");
// pub const WHITELIST: Map<String, bool> = Map::new("whitelist");

pub struct Game {
    
}