import { InlineWidgetNode, Node, PlainTextNode } from '../ast';
import { NodeReplacer } from './type';

const patterns = [
    { regex: /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/, token: 'bitcoin-legacy-p2pkh' },
    { regex: /^3[1-9A-HJ-NP-Za-km-z]{33}$/, token: 'bitcoin-p2sh' },
    { regex: /^bc1q[02-9ac-hj-np-z]{38,58}$/, token: 'bitcoin-bech32-segwit' },
    { regex: /^bc1p[02-9ac-hj-np-z]{58}$/, token: 'bitcoin-taproot-bech32m' },
    { regex: /^ronin:0x[a-fA-F0-9]{40}$/, token: 'ronin' },
    { regex: /^0x[a-fA-F0-9]{64}$/, token: 'move-based' },
    { regex: /^0x[a-fA-F0-9]{40}$/, token: 'evm' },
    { regex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, token: 'solana' },
    { regex: /^cosmos1[0-9a-z]{38}$/, token: 'cosmos-mainnet' },
    { regex: /^inj1[0-9a-z]{38}$/, token: 'injective' },
    { regex: /^osmo1[0-9a-z]{38}$/, token: 'osmosis' },
    { regex: /^terra1[0-9a-z]{38}$/, token: 'terra' },
    { regex: /^[1-9A-HJ-NP-Za-km-z]{46,48}$/, token: 'polkadot-kusama-ss58' },
    { regex: /^addr1[0-9a-z]{54,103}$/, token: 'cardano' },
    {
        regex: /^tz[1-3][1-9A-HJ-NP-Za-km-z]{33}$/,
        token: 'tezos-implicit-account',
    },
    { regex: /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/, token: 'tezos-contract' },
    { regex: /^[A-Z2-7]{58}$/, token: 'algorand' },
    { regex: /^G[A-Z2-7]{55}$/, token: 'stellar-public' },
    { regex: /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/, token: 'xrp-classic' },
    { regex: /^X[1-9A-HJ-NP-Za-km-z]{33,46}$/, token: 'xrp-x-address' },
    { regex: /^T[1-9A-HJ-NP-Za-km-z]{33}$/, token: 'tron-trc-20' },
    { regex: /^[a-z0-9_-]+\.near$/, token: 'near-named' },
    {
        regex: /^ed25519:[1-9A-HJ-NP-Za-km-z]{43,44}$/,
        token: 'near-public-key',
    },
    { regex: /^X-avax1[0-9a-z]{38}$/, token: 'avalanche-x-chain' },
    { regex: /^bnb1[0-9a-z]{38}$/, token: 'binance-chain-bep-2' },
    { regex: /^ltc1[0-9a-z]{39}$/, token: 'litecoin-bech32' },
    { regex: /^D[1-9A-HJ-NP-Za-km-z]{33}$/, token: 'dogecoin-legacy' },
    {
        regex: /^(bitcoincash:)?[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{42}$/,
        token: 'bitcoin-cash-cashaddr',
    },
    { regex: /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/, token: 'monero-standard' },
    { regex: /^8[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/, token: 'monero-integrated' },
    {
        regex: /^zil1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}$/,
        token: 'zilliqa-bech32',
    },
    { regex: /^A[0-9A-HJ-NP-Za-km-z]{33}$/, token: 'neo' },
    {
        regex: /^erd1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58}$/,
        token: 'multiversx-elrond',
    },
    {
        regex: /^one1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}$/,
        token: 'harmony-bech32',
    },
    { regex: /^3P[1-9A-HJ-NP-Za-km-z]{33}$/, token: 'waves' },
    { regex: /^S[PM][0-9A-HJ-NP-Z]{38,40}$/, token: 'stacks-mainnet' },
    { regex: /^f[0-4][0-9a-zA-Z]{38,86}$/, token: 'filecoin-mainnet' },
    { regex: /^t[0-4][0-9a-zA-Z]{38,86}$/, token: 'filecoin-testnet' },
    { regex: /^[EU][Qf][0-9a-zA-Z_-]{46}$/, token: 'ton-user-friendly' },
    { regex: /^0:[a-fA-F0-9]{64}$/, token: 'ton-raw' },
    { regex: /^0\.0\.[1-9]\d*$/, token: 'hedera' },
] as const;

function isNumber(s: string): boolean {
    if (s.startsWith('0x') || s.startsWith('0X')) return false;
    return !isNaN(Number(s));
}

export class AddressNodeReplacer extends NodeReplacer {
    public override tryReplace(node: Node): [Node, number] | undefined {
        if (!(node instanceof PlainTextNode)) return;

        const v = node.value;
        if (v.length < 24 || isNumber(v)) {
            return;
        }

        for (const p of patterns) {
            if (!p.regex.test(v)) continue;
            return [
                new InlineWidgetNode({
                    name: 'tokenAddress',
                    value: {
                        tokenName: p.token,
                        address: v,
                    },
                }),
                0,
            ];
        }

        return;
    }
}
