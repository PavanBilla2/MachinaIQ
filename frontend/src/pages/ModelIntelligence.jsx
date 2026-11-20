import React, { useState } from 'react';
import { PageHeader, Card, SectionTitle, StatusBadge } from '../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Static snapshot copied from the user's machinefailure_updated.ipynb outputs.
// These are research results, not live backend benchmark responses.
const HOLDOUT = [
  { model: 'Logistic Regression', accuracy: .8245, precision: .1418, recall: .8235, f1: .2419, roc: .9070, logLoss: .3842 },
  { model: 'Decision Tree', accuracy: .9360, precision: .3276, recall: .8382, f1: .4711, roc: .8653, logLoss: .3162 },
  { model: 'Random Forest', accuracy: .9770, precision: .6447, recall: .7206, f1: .6806, roc: .9752, logLoss: .0700 },
  { model: 'XGBoost', accuracy: .9870, precision: .9375, recall: .6618, f1: .7759, roc: .9739, logLoss: .0507 },
  { model: 'SVM', accuracy: .9180, precision: .2818, recall: .9118, f1: .4306, roc: .9624, logLoss: .0720 },
];
const CV = [
  { model: 'Logistic Regression', accuracy: .8225, accuracyStd: .0074, precision: .1374, recall: .8044, f1: .2346, f1Std: .0100, roc: .8966, pr: .4409 },
  { model: 'Decision Tree', accuracy: .9367, accuracyStd: .0061, precision: .3313, recall: .8413, f1: .4745, f1Std: .0268, roc: .8851, pr: .5958 },
  { model: 'Random Forest', accuracy: .9762, accuracyStd: .0027, precision: .6436, recall: .6791, f1: .6591, f1Std: .0363, roc: .9700, pr: .7220 },
  { model: 'XGBoost', accuracy: .9835, accuracyStd: .0011, precision: .8555, recall: .6201, f1: .7178, f1Std: .0194, roc: .9748, pr: .7745 },
  { model: 'SVM', accuracy: .9202, accuracyStd: .0062, precision: .2821, recall: .8706, f1: .4258, f1Std: .0252, roc: .9617, pr: .6624 },
];
const OOF_CM = {
  'Logistic Regression': [[6362,1367],[53,218]],
  'Decision Tree': [[7266,463],[43,228]],
  'Random Forest': [[7626,103],[87,184]],
  XGBoost: [[7700,29],[103,168]],
  SVM: [[7126,603],[35,236]],
};
const RF_IMPORTANCE = [
  ['Torque [Nm]',.327744],['Rotational speed [rpm]',.286362],['Tool wear [min]',.209199],['Air temperature [K]',.098727],['Process temperature [K]',.062615],['Type_L',.008687],['Type_M',.006665],
];
const XGB_IMPORTANCE = [
  ['Torque [Nm]',.273290],['Rotational speed [rpm]',.185768],['Tool wear [min]',.182615],['Air temperature [K]',.134273],['Process temperature [K]',.089655],['Type_M',.070986],['Type_L',.063413],
];
const pct = (v) => `${(v*100).toFixed(2)}%`;
const dec = (v) => v.toFixed(4);
const head = 'py-3 px-3 text-right font-mono text-[10px] uppercase tracking-wider text-[#ececec]/50 whitespace-nowrap';
const cell = 'py-3 px-3 text-right font-mono text-xs text-[#00F0FF] whitespace-nowrap';

export default function ModelIntelligence() {
  const [selected, setSelected] = useState('XGBoost');
  const cm = OOF_CM[selected];
  const chartRows = HOLDOUT.map(r => ({ model: r.model.replace('Logistic Regression','LogReg').replace('Random Forest','RandForest'), Accuracy: +(r.accuracy*100).toFixed(2), Precision: +(r.precision*100).toFixed(2), Recall: +(r.recall*100).toFixed(2), F1: +(r.f1*100).toFixed(2) }));
  return <>
    <PageHeader breadcrumb="Benchmark Module [03]" title="Model Bench" subtitle="Notebook-derived experimental results for five supervised classifiers. These benchmark values are a static snapshot; live prediction remains connected to the existing API.">
      <StatusBadge status="info" label="NOTEBOOK RESULTS SNAPSHOT" />
    </PageHeader>
    <div className="mb-5 border border-[#FFE600]/40 bg-[#FFE600]/5 px-4 py-3 text-xs leading-relaxed text-[#ececec]/75">Research benchmark snapshot from <b>machinefailure_updated.ipynb</b>. These tables do not call or modify the backend benchmark endpoints. Holdout results use 2,000 test records; cross-validation uses 5 stratified folds on the 8,000-record training partition.</div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      {[['Best holdout accuracy','XGBoost','98.70%'],['Best holdout F1-score','XGBoost','0.7759'],['Highest holdout recall','SVM','91.18%']].map(([label,model,value])=><Card key={label}><div className="font-mono text-[10px] uppercase tracking-widest text-[#ececec]/45">{label}</div><div className="font-display text-2xl font-extrabold mt-2">{value}</div><div className="font-mono text-xs text-[#00F0FF] mt-1">{model}</div></Card>)}
    </div>
    <Card className="mb-5">
      <SectionTitle sub="Percentage values are shown as percentages; F1-score remains on a 0–1 scale." right="N = 2,000 TEST RECORDS">Holdout Test Evaluation</SectionTitle>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="py-3 px-3 text-left font-mono text-[10px] uppercase text-[#ececec]/50">Model</th>{['Accuracy','Precision','Recall','F1-score','ROC-AUC','Log Loss'].map(x=><th key={x} className={head}>{x}</th>)}</tr></thead><tbody className="divide-y divide-[#ececec]/10">{HOLDOUT.map(r=><tr key={r.model}><td className="py-3 px-3 font-mono text-xs font-bold">{r.model}</td><td className={cell}>{pct(r.accuracy)}</td><td className={cell}>{pct(r.precision)}</td><td className={cell}>{pct(r.recall)}</td><td className={cell}>{dec(r.f1)}</td><td className={cell}>{dec(r.roc)}</td><td className={cell}>{dec(r.logLoss)}</td></tr>)}</tbody></table></div>
    </Card>
    <Card className="mb-5">
      <SectionTitle sub="Mean metrics across five stratified folds. Accuracy and F1 include fold standard deviation." right="5-FOLD STRATIFIED CV">Cross-Validation Benchmark</SectionTitle>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="py-3 px-3 text-left font-mono text-[10px] uppercase text-[#ececec]/50">Model</th>{['Accuracy mean ± SD','Precision','Recall','F1 mean ± SD','ROC-AUC','PR-AUC'].map(x=><th key={x} className={head}>{x}</th>)}</tr></thead><tbody className="divide-y divide-[#ececec]/10">{CV.map(r=><tr key={r.model}><td className="py-3 px-3 font-mono text-xs font-bold">{r.model}</td><td className={cell}>{pct(r.accuracy)} ± {pct(r.accuracyStd)}</td><td className={cell}>{pct(r.precision)}</td><td className={cell}>{pct(r.recall)}</td><td className={cell}>{dec(r.f1)} ± {dec(r.f1Std)}</td><td className={cell}>{dec(r.roc)}</td><td className={cell}>{dec(r.pr)}</td></tr>)}</tbody></table></div>
    </Card>
    <Card className="mb-5">
      <SectionTitle sub="Notebook holdout comparison; values displayed in percent." right="MODEL COMPARISON">Classifier Metric Comparison</SectionTitle>
      <div className="h-[330px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartRows} margin={{top:10,right:10,left:0,bottom:30}}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff12"/><XAxis dataKey="model" tick={{fill:'#aaa',fontSize:10}}/><YAxis domain={[0,100]} tick={{fill:'#aaa',fontSize:10}}/><Tooltip contentStyle={{background:'#161618',border:'1px solid #444',fontSize:11}}/><Legend/><Bar dataKey="Accuracy" fill="#00F0FF"/><Bar dataKey="Precision" fill="#00FF88"/><Bar dataKey="Recall" fill="#FFE600"/><Bar dataKey="F1" fill="#A78BFA"/></BarChart></ResponsiveContainer></div>
    </Card>
    <Card className="mb-5">
      <SectionTitle sub="Out-of-fold predictions on the 8,000-record training partition. These are not the 2,000-record holdout confusion matrices." right="OOF TRAINING SET">Confusion Matrix Explorer</SectionTitle>
      <div className="flex flex-wrap gap-2 mb-5">{Object.keys(OOF_CM).map(m=><button key={m} onClick={()=>setSelected(m)} className={`px-3 py-2 border font-mono text-[11px] ${selected===m?'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/10':'border-white/15 text-white/60 hover:border-white/40'}`}>{m}</button>)}</div>
      <div className="max-w-xl grid grid-cols-[90px_1fr_1fr] gap-2 text-center font-mono text-xs"><div/><div className="text-[#ececec]/55">Predicted 0</div><div className="text-[#ececec]/55">Predicted 1</div><div className="flex items-center justify-center text-[#ececec]/55">Actual 0</div><div className="p-5 bg-[#00F0FF]/10 border border-[#00F0FF]/30"><div className="text-[10px] text-[#ececec]/55">TN</div><b className="text-xl text-[#00F0FF]">{cm[0][0].toLocaleString()}</b></div><div className="p-5 bg-[#FF0055]/10 border border-[#FF0055]/30"><div className="text-[10px] text-[#ececec]/55">FP</div><b className="text-xl text-[#FF6688]">{cm[0][1].toLocaleString()}</b></div><div className="flex items-center justify-center text-[#ececec]/55">Actual 1</div><div className="p-5 bg-[#FF0055]/10 border border-[#FF0055]/30"><div className="text-[10px] text-[#ececec]/55">FN</div><b className="text-xl text-[#FF6688]">{cm[1][0].toLocaleString()}</b></div><div className="p-5 bg-[#00F0FF]/10 border border-[#00F0FF]/30"><div className="text-[10px] text-[#ececec]/55">TP</div><b className="text-xl text-[#00F0FF]">{cm[1][1].toLocaleString()}</b></div></div>
    </Card>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">{[['Random Forest Feature Importance',RF_IMPORTANCE],['XGBoost Feature Importance',XGB_IMPORTANCE]].map(([title,rows])=><Card key={title}><SectionTitle sub="Feature importance from the corresponding notebook classifier." right="FEATURE WEIGHTS">{title}</SectionTitle><div className="space-y-3">{rows.map(([name,value])=><div key={name}><div className="flex justify-between gap-3 text-xs mb-1"><span className="text-[#ececec]/75">{name}</span><span className="font-mono text-[#00F0FF]">{value.toFixed(4)}</span></div><div className="h-1.5 bg-black/50"><div className="h-full bg-[#00F0FF]" style={{width:`${value*100}%`}}/></div></div>)}</div></Card>)}</div>
    <Card><SectionTitle sub="Area-under-curve scores from notebook evaluation." right="AUC SUMMARY">ROC-AUC & Precision–Recall AUC</SectionTitle><div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="py-3 px-3 text-left font-mono text-[10px] uppercase text-[#ececec]/50">Model</th><th className={head}>Holdout ROC-AUC</th><th className={head}>CV ROC-AUC</th><th className={head}>CV PR-AUC</th></tr></thead><tbody className="divide-y divide-white/10">{HOLDOUT.map((r,i)=><tr key={r.model}><td className="py-3 px-3 text-xs">{r.model}</td><td className={cell}>{dec(r.roc)}</td><td className={cell}>{dec(CV[i].roc)}</td><td className={cell}>{dec(CV[i].pr)}</td></tr>)}</tbody></table></div><p className="text-[11px] text-white/45 mt-4">ROC and precision–recall curve coordinates are not embedded in this static view; the numeric AUC results above are the notebook-reported values.</p></Card>
  </>;
}
