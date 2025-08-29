"use client";
import { useEffect, useState } from "react";

const pixelSettingsTabs = ["Meta Pixel", "TikTok Pixel"];

export default function PixelSettingsPage() {
  const [activeTab, setActiveTab] = useState("Meta Pixel");
  const [fbPixelId, setFbPixelId] = useState("");
  const [fbAccessToken, setFbAccessToken] = useState("");
  const [fbTestEventCode, setFbTestEventCode] = useState("");
  const [ttPixelId, setTtPixelId] = useState("");
  const [ttAccessToken, setTtAccessToken] = useState("");

  const [status, setStatus] = useState<"idle"|"saving"|"success"|"error"|"testing"|"connected"|"disconnected">("idle");
  const [showMetaSetup, setShowMetaSetup] = useState(true);

  const deriveStatus = (s: any): "connected" | "disconnected" | "idle" => {
    const hasAny = Boolean(s?.fbPixelId || s?.fbAccessToken || s?.fbTestEventCode);
    const hasCreds = Boolean(s?.fbPixelId && s?.fbAccessToken);
    if (hasCreds) return 'connected';
    if (hasAny) return 'disconnected';
    return 'idle';
  };

  useEffect(()=>{
    (async()=>{
      try{
        const res = await fetch('/api/settings/pixels');
        if(res.ok){
          const s = await res.json();
          setFbPixelId(s?.fbPixelId || "");
          setFbAccessToken(s?.fbAccessToken || "");
          setFbTestEventCode(s?.fbTestEventCode || "");
          setTtPixelId(s?.ttPixelId || "");
          setTtAccessToken(s?.ttAccessToken || "");
          // Derive persistent status on load
          setStatus(deriveStatus(s));
        }
      }catch{}
    })();
  },[]);

  const saveSettings = async () => {
    try{
      setStatus('saving');
      const r = await fetch('/api/settings/pixels',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          fbPixelId,
          fbAccessToken,
          fbTestEventCode,
          ttPixelId,
          ttAccessToken
        })
      });
      if(r.ok){ 
        const saved = await r.json();
        setStatus(deriveStatus(saved));
        // Reload settings to ensure state is synced
      } else { 
        setStatus('error'); 
      }
    }catch{ setStatus('error'); }
  };

  const testConnection = async () => {
    try{
      setStatus('testing');
      const r = await fetch('/api/fb-events',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          event_name:'PageView',
          user_data:{},
          custom_data:{},
          pixelId: fbPixelId || undefined,
          accessToken: fbAccessToken || undefined,
          test_event_code: fbTestEventCode || undefined,
        })
      });
      const json = await r.json();
      if(r.ok && ((json?.events_received === 1) || (json?.data?.[0]?.event_name && !json?.error))){
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
    }catch{ setStatus('disconnected'); }
  };

  const Badge = () => {
    const map:any={success:'bg-green-100 text-green-700', connected:'bg-green-100 text-green-700', error:'bg-yellow-100 text-yellow-700', disconnected:'bg-red-100 text-red-700', saving:'bg-blue-100 text-blue-700', testing:'bg-blue-100 text-blue-700'};
    const label:any={success:'Saved', connected:'Connected', error:'Error', disconnected:'Disconnected', saving:'Saving...', testing:'Testing...'};
    if(status==='idle') return null;
    return (
      <div className="ml-3 flex items-center gap-2">
        <span className={`px-3 py-1 rounded-md text-sm ${map[status]}`}>{label[status]}</span>
        {status==='connected' && (
          <div className="text-green-600 text-sm">
            <div>✅ Meta Events Manager → Test Events এ সাকসেস দেখা যাবে</div>
          </div>
        )}
        {status==='disconnected' && <span className="text-red-600 text-sm">Pixel ID/Token/Test Event Code যাচাই করুন</span>}
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Pixel Settings</h1>
      
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-4">
            {pixelSettingsTabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab 
                    ? "bg-green-100 text-green-700 border border-green-200" 
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === "Meta Pixel" && (
            <div>
              <h3 className="text-lg font-medium mb-4">Meta Pixel Setup</h3>
              {/* Toggle button */}
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowMetaSetup(v => !v)}
                  className={`px-4 py-2 rounded-md text-white ${showMetaSetup ? 'bg-gray-600 hover:bg-gray-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {showMetaSetup ? 'Hide Setup' : 'Show Setup'}
                </button>
                <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${status==='connected' ? 'bg-green-100 text-green-700' : status==='disconnected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                  <span className={`mr-2 inline-block w-2 h-2 rounded-full ${status==='connected' ? 'bg-green-500' : status==='disconnected' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                  {status==='connected' ? 'Pixel Connected' : status==='disconnected' ? 'Not Connected' : 'Status Unknown'}
                </span>
              </div>

              {showMetaSetup && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pixel ID</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Meta Pixel ID..."
                    value={fbPixelId}
                    onChange={e=>setFbPixelId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
                  <input 
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter access token..."
                    value={fbAccessToken}
                    onChange={e=>setFbAccessToken(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test Event Code</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter test event code..."
                    value={fbTestEventCode}
                    onChange={e=>setFbTestEventCode(e.target.value)}
                  />
                </div>
                                 <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                   <div className="flex">
                     <div className="flex-shrink-0">
                       <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                       </svg>
                     </div>
                     <div className="ml-3">
                       <h3 className="text-sm font-medium text-blue-800">
                         Meta Pixel Integration
                       </h3>
                       <div className="mt-2 text-sm text-blue-700">
                         <p>Configure Meta Pixel for Facebook and Instagram advertising tracking. This enables conversion tracking and audience building.</p>
                       </div>
                     </div>
                   </div>
                 </div>
                </div>
              )}

            </div>
          )}
          
          {activeTab === "TikTok Pixel" && (
            <div>
              <h3 className="text-lg font-medium mb-4">TikTok Pixel Setup</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pixel ID</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter TikTok Pixel ID..."
                    value={ttPixelId}
                    onChange={e=>setTtPixelId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
                  <input 
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter access token..."
                    value={ttAccessToken}
                    onChange={e=>setTtAccessToken(e.target.value)}
                  />
                </div>
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        TikTok Pixel Integration
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Configure TikTok Pixel for TikTok advertising tracking. This enables conversion tracking and audience building on TikTok platform.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
             {/* Save Button */}
       <div className="flex justify-end items-center mt-6">
         <button onClick={saveSettings} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
           Save Pixel Settings
         </button>
         <button onClick={testConnection} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-3">
           Test Basic Connection
         </button>

         <Badge />
       </div>
    </div>
  );
}
