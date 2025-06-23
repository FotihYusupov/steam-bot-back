function extractPartnerIdFromTradeUrl(tradeUrl) {
  const url = new URL(tradeUrl);
  const partnerId = url.searchParams.get("partner");
  if (!partnerId) return null;
  const steamId64 = (BigInt(partnerId) + 76561197960265728n).toString();
  return steamId64;
}

console.log(extractPartnerIdFromTradeUrl("https://steamcommunity.com/tradeoffer/new/?partner=1751707663&token=5lnbLAGH"));

function url2id(tradeUrl) {
  const accountIdStr = tradeUrl.split("&")[0].replace(/\D/g, "");
  if (accountIdStr.length !== 9) {
    throw new Error("Incorrect trade URL format");
  }

  const accountId = parseInt(accountIdStr, 10);
  const id32 = `STEAM_0:${accountId & 1}:${accountId >> 1}`;

  let id64 = 76561197960265728n; // Use BigInt for 64-bit integers
  const idSplit = id32.split(":");
  id64 += BigInt(parseInt(idSplit[2], 10) * 2);
  if (idSplit[1] === "1") {
    id64 += 1n;
  }

  return {
    id32,
    id64: id64.toString()
  };
}

function id2url(id32) {
  const parts = id32.split(":");
  if (parts.length === 3 && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[2])) {
    const accountId = (parseInt(parts[2], 10) << 1) + parseInt(parts[1], 10);
    return `https://steamcommunity.com/tradeoffer/new/?partner=${accountId}`;
  } else {
    throw new Error("Incorrect SteamID32 format");
  }
}

function id2url64(id64) {
  if (/^\d{17}$/.test(id64)) {
    const accountId = BigInt(id64) - 76561197960265728n;
    return `https://steamcommunity.com/tradeoffer/new/?partner=${accountId.toString()}`;
  } else {
    throw new Error("Incorrect SteamID64 format");
  }
}


console.log(id2url(1751707663 + ":1:1751707663"));