// src/components/wallet/WalletLogo.jsx
// Authentic SVG brand logos for Indonesian banks, e-wallets, and crypto exchanges

import { Building2, Smartphone, TrendingUp, Banknote } from 'lucide-react';

const BRAND_META = {
  // Indonesian Banks
  bca:        { title: 'Bank Central Asia (BCA)',        file: '/logos/bca.svg',        bg: 'bg-white' },
  jago:       { title: 'Bank Jago',                      file: '/logos/jago.svg',       bg: 'bg-white' },
  bri:        { title: 'Bank Rakyat Indonesia (BRI)',    file: '/logos/bri.svg',        bg: 'bg-white' },
  mandiri:    { title: 'Bank Mandiri',                   file: '/logos/mandiri.svg',    bg: 'bg-white' },
  bni:        { title: 'Bank Negara Indonesia (BNI)',    file: '/logos/bni.svg',        bg: 'bg-white' },
  seabank:    { title: 'SeaBank',                        file: '/logos/seabank.svg',    bg: 'bg-white' },
  jenius:     { title: 'Jenius (BTPN)',                  file: '/logos/jenius.svg',     bg: 'bg-white' },
  bsi:        { title: 'Bank Syariah Indonesia (BSI)',   file: '/logos/bsi.svg',        bg: 'bg-white' },
  permata:    { title: 'PermataBank',                    file: '/logos/permata.svg',    bg: 'bg-white' },
  danamon:    { title: 'Bank Danamon',                   file: '/logos/danamon.svg',    bg: 'bg-white' },
  maybank:    { title: 'Maybank Indonesia',              file: '/logos/maybank.svg',    bg: 'bg-white' },
  mega:       { title: 'Bank Mega',                      file: '/logos/mega.svg',       bg: 'bg-white' },
  neobank:    { title: 'Bank Neo Commerce (Neobank)',    file: '/logos/neobank.svg',    bg: 'bg-white' },
  uob:        { title: 'UOB Indonesia',                  file: '/logos/uob.svg',        bg: 'bg-white' },
  hsbc:       { title: 'HSBC',                           file: '/logos/hsbc.svg',       bg: 'bg-white' },
  btn:        { title: 'Bank BTN',                       file: '/logos/btn.svg',        bg: 'bg-white' },

  // Indonesian E-Wallets
  gopay:      { title: 'GoPay',                          file: '/logos/gopay.svg',      bg: 'bg-white' },
  shopeepay:  { title: 'ShopeePay',                      file: '/logos/shopeepay.svg',  bg: 'bg-white' },
  dana:       { title: 'DANA',                           file: '/logos/dana.svg',       bg: 'bg-white' },
  ovo:        { title: 'OVO',                            file: '/logos/ovo.svg',        bg: 'bg-white' },
  linkaja:    { title: 'LinkAja',                        file: '/logos/linkaja.svg',    bg: 'bg-white' },
  astrapay:   { title: 'AstraPay',                       file: '/logos/astrapay.svg',   bg: 'bg-white' },
  isaku:      { title: 'i.saku',                         file: '/logos/isaku.svg',      bg: 'bg-white' },

  // Crypto Exchanges & Assets
  binance:    { title: 'Binance',                        file: '/logos/binance.svg',    bg: 'bg-[#181A20]' },
  okx:        { title: 'OKX',                            file: '/logos/okx.svg',        bg: 'bg-white' },
  bybit:      { title: 'Bybit',                          file: '/logos/bybit.svg',      bg: 'bg-white' },
  gateio:     { title: 'Gate.io',                        file: '/logos/gateio.svg',     bg: 'bg-white' },
  coinbase:   { title: 'Coinbase',                       file: '/logos/coinbase.svg',   bg: 'bg-white' },
  kucoin:     { title: 'KuCoin',                         file: '/logos/kucoin.svg',     bg: 'bg-white' },
  bitcoin:    { title: 'Bitcoin (BTC)',                  file: '/logos/bitcoin.svg',    bg: 'bg-white' },
  ethereum:   { title: 'Ethereum (ETH)',                 file: '/logos/ethereum.svg',   bg: 'bg-white' },
  tether:     { title: 'Tether (USDT)',                  file: '/logos/tether.svg',     bg: 'bg-white' },
  solana:     { title: 'Solana (SOL)',                   file: '/logos/solana.svg',     bg: 'bg-white' },
};

/**
 * Detect brand key from wallet name and type
 */
export function getWalletBrand(name = '', type = '') {
  const n = String(name).toLowerCase();
  const t = String(type).toLowerCase();

  // Crypto Exchanges & Coins (check before generic banks/investment)
  if (n.includes('binance')) return 'binance';
  if (/\bokx\b/.test(n) || n.includes('okex')) return 'okx';
  if (n.includes('bybit')) return 'bybit';
  if (n.includes('coinbase')) return 'coinbase';
  if (n.includes('kucoin')) return 'kucoin';
  if (n.includes('bitcoin') || /\bbtc\b/.test(n)) return 'bitcoin';
  if (n.includes('ethereum') || /\beth\b/.test(n)) return 'ethereum';
  if (n.includes('tether') || /\busdt\b/.test(n)) return 'tether';
  if (n.includes('solana') || /\bsol\b/.test(n)) return 'solana';

  // Indonesian Banks
  if (n.includes('bca') && !n.includes('blu')) return 'bca';
  if (n.includes('jago')) return 'jago';
  if (/\bbri\b/.test(n) || n.includes('rakyat')) return 'bri';
  if (n.includes('mandiri') || n.includes('livin')) return 'mandiri';
  if (/\bbni\b/.test(n) || n.includes('wondr')) return 'bni';
  if (n.includes('seabank') || n.includes('sea bank')) return 'seabank';
  if (n.includes('jenius') || n.includes('btpn')) return 'jenius';
  if (/\bbsi\b/.test(n) || n.includes('syariah')) return 'bsi';
  if (n.includes('permata')) return 'permata';
  if (n.includes('danamon')) return 'danamon';
  if (n.includes('maybank')) return 'maybank';
  if (n.includes('mega')) return 'mega';
  if (n.includes('neobank') || /\bneo\b/.test(n) || n.includes('bnc')) return 'neobank';
  if (/\buob\b/.test(n) || n.includes('tmrw')) return 'uob';
  if (n.includes('hsbc')) return 'hsbc';
  if (/\bbtn\b/.test(n)) return 'btn';

  // Indonesian E-Wallets
  if (n.includes('shopee') || n.includes('spay')) return 'shopeepay';
  if (n.includes('gopay') || n.includes('gojek')) return 'gopay';
  if (n.includes('dana')) return 'dana';
  if (/\bovo\b/.test(n)) return 'ovo';
  if (n.includes('linkaja') || n.includes('link aja')) return 'linkaja';
  if (n.includes('astrapay')) return 'astrapay';
  if (n.includes('isaku') || n.includes('i.saku')) return 'isaku';

  // Fallback by type
  if (t === 'cash' || n.includes('cash') || n.includes('tunai') || n.includes('dompet')) return 'cash';
  if (t === 'investment' || n.includes('kripto') || n.includes('crypto') || n.includes('saham') || n.includes('bibit') || n.includes('ajaib')) return 'investment';
  if (t === 'bank') return 'generic-bank';
  if (t === 'e-wallet') return 'generic-ewallet';

  return 'generic';
}

export default function WalletLogo({ wallet, name, type, size = 'md', className = '' }) {
  const walletName = name || wallet?.name || '';
  const walletType = type || wallet?.type || '';
  const brand = getWalletBrand(walletName, walletType);

  const sizeMap = {
    xs: 'w-5 h-5 rounded-md p-0.5',
    sm: 'w-6 h-6 rounded-lg p-0.5',
    md: 'w-8 h-8 rounded-xl p-1',
    lg: 'w-10 h-10 rounded-2xl p-1.5',
    xl: 'w-12 h-12 rounded-2xl p-1.5',
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const meta = BRAND_META[brand];

  if (meta) {
    return (
      <div
        title={meta.title}
        className={`shrink-0 flex items-center justify-center shadow-sm border border-black/10 dark:border-white/10 overflow-hidden select-none ${meta.bg} ${currentSize} ${className}`}
      >
        <img
          src={meta.file}
          alt={meta.title}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  // Clean icon fallbacks for generic / cash / investment wallets
  switch (brand) {
    case 'cash':
      return (
        <div
          title="Cash / Tunai"
          className={`shrink-0 flex items-center justify-center shadow-sm bg-emerald-600 text-white select-none ${currentSize} ${className}`}
        >
          <Banknote className="w-[70%] h-[70%] stroke-[2.2]" />
        </div>
      );

    case 'investment':
      return (
        <div
          title="Investment / Crypto"
          className={`shrink-0 flex items-center justify-center shadow-sm bg-purple-600 text-white select-none ${currentSize} ${className}`}
        >
          <TrendingUp className="w-[70%] h-[70%] stroke-[2.2]" />
        </div>
      );

    case 'generic-ewallet':
      return (
        <div
          title="E-Wallet"
          className={`shrink-0 flex items-center justify-center shadow-sm bg-teal text-[#0B1215] select-none ${currentSize} ${className}`}
        >
          <Smartphone className="w-[70%] h-[70%] stroke-[2.2]" />
        </div>
      );

    case 'generic-bank':
    default:
      return (
        <div
          title={walletName || 'Bank Account'}
          className={`shrink-0 flex items-center justify-center shadow-sm bg-slate-700 text-teal select-none ${currentSize} ${className}`}
        >
          <Building2 className="w-[70%] h-[70%] stroke-[2.2]" />
        </div>
      );
  }
}
