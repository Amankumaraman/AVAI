import { useState } from 'react';
import {
  Bot,
  Shield,
  Zap,
  EyeOff,
  Cpu,
  Monitor,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Code2,
  Calendar,
  Key,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const GithubIcon = ({ size = 20, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function App() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{ orderId: string; paymentId: string } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleBuyLifetimePass = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // Step 1: Vercel Serverless API Function - Create Order (/api/create-order)
      let orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 50000, // ₹500 INR = 50000 paise
          currency: 'INR',
          receipt: `rcpt_avai_${Date.now()}`,
        }),
      }).catch(() => null);

      if (!orderRes || !orderRes.ok) {
        // Fallback to local Python backend port 8000
        orderRes = await fetch('http://localhost:8000/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 50000,
            currency: 'INR',
            receipt: `rcpt_avai_${Date.now()}`,
          }),
        });
      }

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({ detail: orderRes.statusText }));
        throw new Error(errData.detail || errData.error || 'Failed to create payment order.');
      }

      const orderData = await orderRes.json();
      const razorpayKeyId =
        import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.key_id || 'rzp_test_TNA6Lv7QbmAMn8';

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Step 2: Frontend - Open Razorpay Standard Checkout Modal
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'AVAI Assistant',
        description: 'AVAI Windows Lifetime Pass (₹500 INR)',
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // Step 3: Vercel Serverless API Function - Verify Payment Signature (/api/verify-payment)
            let verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            }).catch(() => null);

            if (!verifyRes || !verifyRes.ok) {
              verifyRes = await fetch('http://localhost:8000/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
            }

            const verifyData = await verifyRes.json();
            setIsProcessingPayment(false);

            if (verifyRes.ok && verifyData.status === 'success') {
              setPaymentSuccess({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });
            } else {
              setPaymentError(verifyData.detail || verifyData.error || 'Payment verification failed: Signature mismatch.');
            }
          } catch (err: any) {
            setIsProcessingPayment(false);
            setPaymentError(err.message || 'Payment verification failed.');
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          },
        },
        prefill: {
          name: 'AVAI User',
          email: 'user@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#6366f1',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setIsProcessingPayment(false);
        setPaymentError(response.error?.description || 'Payment transaction failed.');
      });
      rzp.open();
    } catch (err: any) {
      setIsProcessingPayment(false);
      setPaymentError(err.message || 'Could not connect to payment service.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(7, 10, 18, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/logo.png"
              alt="AVAI AI Logo"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                objectFit: 'cover',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)',
                border: '1px solid rgba(6, 182, 212, 0.5)',
              }}
            />
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                AVAI
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--cyan)',
                  marginLeft: '8px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                }}
              >
                FOR WINDOWS
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <a href="#features" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Features
            </a>
            <a href="#stealth" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Stealth Mode
            </a>
            <a href="#compatibility" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Compatibility
            </a>
            <a href="#pricing" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Pricing (₹500)
            </a>
            <a href="#faq" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              FAQ
            </a>
          </nav>

          {/* Header Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="https://github.com/Amankumaraman/AVAI"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <GithubIcon size={16} /> GitHub Repo
            </a>
            <button
              type="button"
              onClick={handleBuyLifetimePass}
              disabled={isProcessingPayment}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {isProcessingPayment ? 'Processing...' : 'Buy Lifetime — ₹500'}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section
        style={{
          padding: '80px 24px 60px',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        {/* Stealth Badge Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '30px',
            padding: '6px 16px',
            fontSize: '0.82rem',
            color: 'var(--primary)',
            fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          <Sparkles size={14} /> 100% Invisible Desktop Widget for Windows 10 & 11
        </div>

        <h1
          className="gradient-text"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            marginBottom: '20px',
            maxWidth: '900px',
            margin: '0 auto 20px',
          }}
        >
          Conquer Coding Interviews & Exams in Complete Stealth.
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--text-muted)',
            maxWidth: '750px',
            margin: '0 auto 36px',
            fontWeight: 400,
          }}
        >
          AVAI is the #1 AI Study & Focus Assistant built for Windows. Featuring <strong style={{ color: '#fff' }}>sub-100ms screen capture</strong>, <strong style={{ color: '#fff' }}>100% screen-share invisibility</strong> (Zoom & Google Meet), and Groq LPU sub-200ms speed.
        </p>

        {/* Hero CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleBuyLifetimePass}
            disabled={isProcessingPayment}
            className="btn-primary"
            style={{ padding: '14px 32px', fontSize: '1rem', cursor: 'pointer' }}
          >
            {isProcessingPayment ? 'Opening Checkout...' : 'Get Lifetime Access — ₹500 INR'} <ArrowRight size={18} />
          </button>
          <a
            href="https://github.com/Amankumaraman/AVAI"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ padding: '14px 28px', fontSize: '1rem' }}
          >
            <GithubIcon size={18} /> View GitHub Repository ↗
          </a>
        </div>

        {/* 3. Interactive Floating App Preview Card */}
        <div style={{ marginTop: '50px', position: 'relative' }}>
          <div
            className="glass-panel"
            style={{
              maxWidth: '850px',
              margin: '0 auto',
              padding: '16px',
              textAlign: 'left',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              background: '#090d16',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.15)',
            }}
          >
            {/* Header bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Traffic dots */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                  <Bot size={16} style={{ color: 'var(--cyan)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>AVAI — Floating Assistant</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  ⚡ Stealth Active (Ctrl+\)
                </span>
              </div>
            </div>

            {/* AI Code Response Preview */}
            <div
              style={{
                background: '#0d121f',
                borderRadius: '10px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: '#e5e7eb',
                lineHeight: 1.6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '8px' }}>
                <span>🤖 AI Solution Code (LeetCode 1. Two Sum)</span>
                <span>⏱️ Response Time: 0.18s (Groq LPU)</span>
              </div>

              <pre style={{ margin: 0, color: '#38bdf8', overflowX: 'auto' }}>
{`def twoSum(nums: list[int], target: int) -> list[int]:
    """
    Optimal O(N) Hash Map Solution with O(N) Space Complexity
    """
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Big-O Analysis:
# Time Complexity:  O(N) - Single pass through the array
# Space Complexity: O(N) - Hash map stores up to N elements`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Windows Compatibility Badge Section */}
      <section
        id="compatibility"
        style={{
          background: 'rgba(15, 23, 42, 0.4)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '40px 24px',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
              <Monitor size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Windows 10 & 11 64-Bit</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Native Win32 & Edge WebView2 desktop runtime integration.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Zap size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Sub-100ms Capture Speed</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Captures primary display in 10ms with 80KB JPEG downscaling.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)' }}>
              <Shield size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Zero Taskbar Traces</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Uses `WS_EX_TOOLWINDOW` to completely hide from Windows Taskbar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Key Features Grid */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
            Engineered for Stealth & Extreme Speed
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto' }}>
            Everything you need to solve complex algorithmic coding problems, pass technical interviews, and excel in exams without being detected.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Feature 1 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '18px' }}>
              <EyeOff size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              100% Screen Share Invisibility
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Uses native Win32 <code style={{ color: 'var(--cyan)' }}>WDA_EXCLUDEFROMCAPTURE</code> display affinity. Your floating widget remains 100% invisible to Google Meet, Zoom, Microsoft Teams, and Discord screen shares.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)', marginBottom: '18px' }}>
              <Code2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              Automatic Code Solution Mode
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Submitting a screen capture automatically triggers Coding Solution Mode, outputting complete, executable Python/C++/Java solution code blocks with Big-O Time & Space Complexity analysis.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)', marginBottom: '18px' }}>
              <Cpu size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              Groq LPU Sub-200ms Inference
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Powered by Groq LPU hardware acceleration (`llama-3.3-70b-versatile`) and Google Gemma 4 vision models for lightning-fast solution generation in under 200 milliseconds.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)', marginBottom: '18px' }}>
              <Key size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              Global OS Hotkeys
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Toggle stealth window visibility instantly from anywhere on Windows using <code style={{ color: '#fff' }}>Ctrl + \</code> or <code style={{ color: '#fff' }}>Alt + H</code>, even when AVAI is completely hidden (<code style={{ color: 'var(--cyan)' }}>SW_HIDE</code>).
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '18px' }}>
              <Calendar size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              Date-Wise Saved Responses
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              All your chat history and screen analysis solutions are automatically persisted locally and organized date-wise in Settings with exact timestamps and clear actions.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)', marginBottom: '18px' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              Auto Microphone Permissions
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Built with Chromium <code style={{ color: 'var(--cyan)' }}>--use-fake-ui-for-media-stream</code> flags so microphone access is pre-granted automatically without displaying browser permission prompts.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section (Highlighting ₹500 Lifetime) */}
      <section id="pricing" style={{ padding: '80px 24px', background: 'rgba(15, 23, 42, 0.5)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--emerald)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            <Sparkles size={14} /> SIMPLE ONE-TIME PRICING — NO MONTHLY SUBSCRIPTIONS
          </div>

          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
            Get AVAI Lifetime Pass for Only ₹500
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 48px' }}>
            Pay once, use forever. Get full access to AVAI Windows desktop software, stealth engine, and lifetime software updates.
          </p>

          {/* Pricing Card */}
          <div
            className="glass-panel"
            style={{
              maxWidth: '520px',
              margin: '0 auto',
              padding: '40px',
              border: '2px solid var(--primary)',
              boxShadow: '0 20px 50px rgba(99, 102, 241, 0.25)',
              position: 'relative',
            }}
          >
            {/* Popular Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, var(--primary), var(--cyan))',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '4px 16px',
                borderRadius: '20px',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 15px var(--primary-glow)',
              }}
            >
              LIFETIME ACCESS PASS
            </div>

            <div style={{ margin: '16px 0 24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹4,999</span>
                <span style={{ fontSize: '3.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>₹500</span>
                <span style={{ fontSize: '1rem', color: 'var(--cyan)', fontWeight: 600 }}>INR / Lifetime</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                One-time payment • Lifetime access • 0 recurring fees
              </p>
            </div>

            {/* Feature Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', marginBottom: '32px' }}>
              {[
                'Full AVAI Windows Desktop Software (Win 10 & 11)',
                '100% Stealth Mode (Invisible to Zoom & Meet)',
                'Sub-100ms Screen Capture & Code Analysis',
                'Groq LPU Sub-200ms Inference Speed',
                'Global OS Hotkeys (Ctrl+\\ & Alt+H)',
                'Date-Wise Saved Responses & Chat History',
                'Full GitHub Source Code Access Included',
                'Lifetime Software Updates & Direct Support',
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#e2e8f0' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Pre-payment vs Post-payment Download Action Button */}
            {paymentSuccess ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--emerald)', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
                <div style={{ color: 'var(--emerald)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>
                  🎉 Payment Verified & Software Unlocked!
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Your ₹500 lifetime license is active. Download your Windows software package below.
                </p>
                <a
                  href={import.meta.env.VITE_SUPABASE_DOWNLOAD_URL || "/downloads/AVAI-Setup-Windows.zip"}
                  download="AVAI_Setup_v1.0.exe"
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '16px',
                    fontSize: '1.05rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  📥 Download Software Now (AVAI_Setup_v1.0.exe) <ArrowRight size={18} />
                </a>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.82rem',
                    color: 'var(--amber)',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>🔒 Software download requires payment of ₹500 INR</span>
                </div>
                <button
                  type="button"
                  onClick={handleBuyLifetimePass}
                  disabled={isProcessingPayment}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '16px',
                    fontSize: '1.05rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    opacity: isProcessingPayment ? 0.7 : 1,
                  }}
                >
                  {isProcessingPayment ? 'Opening Checkout...' : 'Pay ₹500 to Unlock & Download Software'} <ArrowRight size={18} />
                </button>
              </div>
            )}

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '14px' }}>
              🔒 Instant Access after payment • Compatible with Windows 10 & 11 (64-Bit)
            </p>
          </div>
        </div>
      </section>

      {/* 7. GitHub Repository Integration Section */}
      <section style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div
          className="glass-panel"
          style={{
            padding: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
            flexWrap: 'wrap',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.6))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <GithubIcon size={24} style={{ color: 'var(--cyan)' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                Open Source & Hosted on GitHub
              </h3>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Check out the official GitHub repository for source code, release tags, installation instructions, and commits.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <code style={{ background: '#090d16', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--cyan)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                git clone https://github.com/Amankumaraman/AVAI.git
              </code>
            </div>
          </div>

          <div>
            <a
              href="https://github.com/Amankumaraman/AVAI"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ padding: '14px 28px', fontSize: '0.95rem' }}
            >
              <GithubIcon size={18} /> View repository on GitHub ↗
            </a>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" style={{ padding: '60px 24px 80px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
            Got questions? We've got answers.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            {
              q: 'Is AVAI really 100% invisible during screen sharing?',
              a: 'Yes! AVAI uses native Windows Win32 WDA_EXCLUDEFROMCAPTURE display affinity. When you share your entire desktop screen on Zoom, Google Meet, or Discord, the AVAI floating window remains completely invisible to viewers while remaining fully visible to you.',
            },
            {
              q: 'Is ₹500 a one-time fee or monthly subscription?',
              a: '₹500 INR is a strictly ONE-TIME payment for a Lifetime Access Pass. There are zero recurring monthly subscriptions or hidden charges.',
            },
            {
              q: 'Which operating systems are supported?',
              a: 'AVAI is built specifically for Windows 10 and Windows 11 (64-Bit systems). It runs lightweight in the background using native Edge WebView2.',
            },
            {
              q: 'How fast is the screen analysis and code generation?',
              a: 'Screen capture takes less than 100ms, and Groq LPU acceleration generates full Python, C++, or Java solution code in under 1-2 seconds.',
            },
            {
              q: 'Can I update my API keys inside the application?',
              a: 'Yes! You can update your OpenRouter or Groq API keys directly inside the Settings modal (yellow dot) at any time. Changes persist automatically.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-panel"
              style={{ padding: '20px 24px', cursor: 'pointer' }}
              onClick={() => toggleFaq(idx)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{item.q}</h4>
                {activeFaq === idx ? <ChevronUp size={18} style={{ color: 'var(--cyan)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
              </div>
              {activeFaq === idx && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.6, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. Footer */}
      <footer
        style={{
          marginTop: 'auto',
          background: 'rgba(5, 7, 13, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '40px 24px 30px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, var(--primary), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Bot size={16} />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>AVAI — Stealth Study Assistant</span>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            © 2026 AVAI Assistant. Built for Windows. All rights reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="https://github.com/Amankumaraman/AVAI" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              GitHub Repository
            </a>
            <a href="#pricing" style={{ fontSize: '0.85rem', color: 'var(--cyan)', fontWeight: 600 }}>
              Lifetime Pass (₹500)
            </a>
          </div>
        </div>
      </footer>

      {/* Payment Success Modal */}
      {paymentSuccess && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '32px', textAlign: 'center', border: '2px solid var(--emerald)', background: '#0d1424' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)', marginBottom: '16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              Payment Verified! 🎉
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Your ₹500 Lifetime Pass is active. Download your Windows software package below:
            </p>

            {/* Direct Download Button */}
            <a
              href={import.meta.env.VITE_SUPABASE_DOWNLOAD_URL || "/downloads/AVAI-Setup-Windows.zip"}
              download="AVAI_Setup_v1.0.exe"
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '16px',
                fontSize: '1.1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                boxShadow: '0 4px 25px rgba(16, 185, 129, 0.4)',
                marginBottom: '20px',
              }}
            >
              📥 Download AVAI Windows Software Now (.exe) <ArrowRight size={18} />
            </a>

            {/* Quick Setup Instructions */}
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '10px', textAlign: 'left', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '20px', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: 'var(--cyan)', marginBottom: '6px' }}>⚙️ Quick Windows Setup Instructions:</div>
              <div>1. Download & extract <code>AVAI-Setup-Windows.zip</code></div>
              <div>2. Double-click <code>Start_AVAI.bat</code> to launch</div>
              <div>3. Press <code>Ctrl + \</code> or <code>Alt + H</code> to toggle stealth mode!</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', textAlign: 'left', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '20px' }}>
              <div><strong>Payment ID:</strong> {paymentSuccess.paymentId}</div>
              <div><strong>Order ID:</strong> {paymentSuccess.orderId}</div>
            </div>

            <button
              type="button"
              onClick={() => setPaymentSuccess(null)}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* Payment Error Toast */}
      {paymentError && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, background: '#1e1115', border: '1px solid #ef4444', borderRadius: '12px', padding: '16px 20px', maxWidth: '400px', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '0.88rem' }}>⚠️ {paymentError}</span>
          <button onClick={() => setPaymentError(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}
    </div>
  );
}
