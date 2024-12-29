use cw_storage_plus::Item;

pub const ADMIN: Item<String> = Item::new("admin");
pub const COUNT: Item<u64> = Item::new("count");
