// src/components/wallet/WalletLogo.jsx
// Visual brand logos for Indonesian banks & e-wallets (BCA, ShopeePay, GoPay, DANA, Jago, BRI, Mandiri, BNI, etc.)

import { Building2, Wallet, Smartphone, TrendingUp, Coins, Banknote } from 'lucide-react';

/**
 * Detect brand key from wallet name and type
 */
export function getWalletBrand(name = '', type = '') {
  const n = String(name).toLowerCase();
  const t = String(type).toLowerCase();

  if (n.includes('bca')) return 'bca';
  if (n.includes('jago')) return 'jago';
  if (n.includes('shopee') || n.includes('spay')) return 'shopeepay';
  if (n.includes('gopay') || n.includes('gojek')) return 'gopay';
  if (n.includes('dana')) return 'dana';
  if (/\bbri\b/.test(n) || n.includes('rakyat')) return 'bri';
  if (n.includes('mandiri') || n.includes('livin')) return 'mandiri';
  if (/\bbni\b/.test(n) || n.includes('wondr')) return 'bni';
  if (n.includes('ovo')) return 'ovo';
  if (n.includes('seabank') || n.includes('sea bank')) return 'seabank';
  if (n.includes('jenius') || n.includes('btpn')) return 'jenius';
  if (n.includes('bsi') || n.includes('syariah')) return 'bsi';
  if (n.includes('cimb') || n.includes('niaga')) return 'cimb';
  if (n.includes('permata')) return 'permata';

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

  // Size configurations (outer container)
  const sizeMap = {
    xs: 'w-5 h-5 text-[9px] rounded-md',
    sm: 'w-6 h-6 text-[10px] rounded-lg',
    md: 'w-8 h-8 text-xs rounded-xl',
    lg: 'w-10 h-10 text-sm rounded-2xl',
    xl: 'w-12 h-12 text-base rounded-2xl',
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Render specific brand SVG / Badge
  switch (brand) {
    case 'bca':
      return (
        <div
          title="Bank Central Asia (BCA)"
          className={`shrink-0 flex items-center justify-center font-black tracking-tighter shadow-sm bg-[#005EAA] text-white select-none ${currentSize} ${className}`}
        >
          <span className="scale-90 font-sans leading-none">BCA</span>
        </div>
      );

    case 'jago':
      return (
        <div
          title="Bank Jago"
          className={`shrink-0 flex items-center justify-center font-extrabold shadow-sm bg-[#FF7A00] text-white select-none ${currentSize} ${className}`}
        >
          <span className="scale-90 font-sans tracking-tight lowercase">jago</span>
        </div>
      );

    case 'shopeepay':
      return (
        <div
          title="ShopeePay"
          className={`shrink-0 flex items-center justify-center shadow-sm bg-[#EE4D2D] text-white select-none relative overflow-hidden ${currentSize} ${className}`}
        >
          {/* Stylized Shopee bag 'S' */}
          <svg className="w-[65%] h-[65%]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
      );

    case 'gopay':
      return (
        <div
          title="GoPay"
          className={`shrink-0 flex items-center justify-center shadow-sm bg-[#00AED6] text-white select-none ${currentSize} ${className}`}
        >
          {/* GoPay circular emblem */}
          <div className="w-[58%] h-[58%] rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-[38%] h-[38%] rounded-full bg-white" />
          </div>
        </div>
      );

    case 'dana':
      return (
        <div
          title="DANA"
          className={`shrink-0 flex items-center justify-center font-black shadow-sm bg-[#118EEA] text-white select-none ${currentSize} ${className}`}
        >
          <span className="scale-[0.8] tracking-wider uppercase font-sans">DANA</span>
        </div>
      );

    case 'bri':
      return (
        <div
          title="Bank Rakyat Indonesia (BRI)"
          className={`shrink-0 flex items-center justify-center font-black shadow-sm bg-[#00529C] text-white select-none relative overflow-hidden ${currentSize} ${className}`}
        >
          <div className="absolute top-0 right-0 w-2 h-2 bg-[#F37024] rounded-bl-full" />
          <span className="scale-90 tracking-tight font-sans">BRI</span>
        </div>
      );

    case 'mandiri':
      return (
        <div
          title="Bank Mandiri"
          className={`shrink-0 flex items-center justify-center font-bold shadow-sm bg-[#003876] text-[#F5A623] select-none ${currentSize} ${className}`}
        >
          <span className="scale-[0.75] font-black uppercase text-white">MND</span>
        </div>
      );

    case 'bni':
      return (
        <div
          title="Bank Negara Indonesia (BNI)"
          className={`shrink-0 flex items-center justify-center font-black shadow-sm bg-[#005E6A] text-[#F15A24] select-none relative overflow-hidden ${currentSize} ${className}`}
        >
          <span className="scale-90 font-black text-white font-sans">BNI</span>
        </div>
      );

    case 'ovo':
      return (
        <div
          title="OVO"
          className={`shrink-0 flex items-center justify-center font-black shadow-sm bg-[#4C3494] text-white select-none ${currentSize} ${className}`}
        >
          <span className="scale-80 tracking-tight font-sans">OVO</span>
        </div>
      );

    case 'seabank':
      return (
        <div
          title="SeaBank"
          className={`shrink-0 flex items-center justify-center font-extrabold shadow-sm bg-[#FF5722] text-white select-none ${currentSize} ${className}`}
        >
          <span className="scale-[0.72] tracking-tighter uppercase font-sans">SEA</span>
        </div>
      );

    case 'jenius':
      return (
        <div
          title="Jenius BTPN"
          className={`shrink-0 flex items-center justify-center font-black shadow-sm bg-[#00A9E0] text-white select-none relative ${currentSize} ${className}`}
        >
          <span className="scale-[0.8] tracking-tighter lowercase font-sans">jen</span>
        </div>
      );

    case 'cash':
      return (
        <div
          title="Cash / Tunai"
          className={`shrink-0 flex items-center justify-center shadow-sm bg-emerald-600 text-white select-none ${currentSize} ${className}`}
        >
          <Banknote className="w-[60%] h-[60%] stroke-[2.2]" />
        </div>
      );

    case 'investment':
      return (
        <div
          title="Investment / Crypto"
          className={`shrink-0 flex items-center justify-center shadow-sm bg-purple-600 text-white select-none ${currentSize} ${className}`}
        >
          <TrendingUp className="w-[60%] h-[60%] stroke-[2.2]" />
        </div>
      );

    case 'generic-ewallet':
      return (
        <div
          title="E-Wallet"
          className={`shrink-0 flex items-center justify-center shadow-sm bg-teal text-bg select-none ${currentSize} ${className}`}
        >
          <Smartphone className="w-[60%] h-[60%] stroke-[2.2]" />
        </div>
      );

    case 'generic-bank':
    default:
      return (
        <div
          title={walletName || 'Bank Account'}
          className={`shrink-0 flex items-center justify-center shadow-sm bg-slate-700 text-teal select-none ${currentSize} ${className}`}
        >
          <Building2 className="w-[60%] h-[60%] stroke-[2.2]" />
        </div>
      );
  }
}
