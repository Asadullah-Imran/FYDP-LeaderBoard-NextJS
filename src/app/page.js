'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Trophy, Medal, ArrowRight, Sparkles, AlertCircle, Cpu, BarChart3, ChevronsUpDown } from 'lucide-react';
import { useData } from '@/context/DataContext';

export default function Dashboard() {
  const { sections, models, globalLoading: loading, fetchGlobalData } = useData();
  const [metricTab, setMetricTab] = useState('ARI'); // 'ARI' | 'NMI' | 'Silhouette'
  
  // Multi-select dataset filters
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef(null);
  const hasInitializedFilter = useRef(false);

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const nonEmptySections = sections.filter(section => 
    models.some(m => m.datasetSectionId?._id === section._id)
  );

  // Initialize selectedDatasets to select all nonEmptySections on load
  useEffect(() => {
    if (nonEmptySections.length > 0 && !hasInitializedFilter.current) {
      setSelectedDatasets(nonEmptySections.map(s => s._id));
      hasInitializedFilter.current = true;
    }
  }, [nonEmptySections]);

  // Click outside dropdown handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setFilterDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDatasetSelection = (id) => {
    setSelectedDatasets(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleAllDatasets = () => {
    if (selectedDatasets.length === nonEmptySections.length) {
      setSelectedDatasets([]);
    } else {
      setSelectedDatasets(nonEmptySections.map(s => s._id));
    }
  };

  // Compute overall performance of models across all datasets
  const getOverallPerformance = () => {
    const performances = {};
    models.forEach(model => {
      if (!model.results || model.results.length === 0) return;
      
      // Filter by selected datasets list
      if (!selectedDatasets.includes(model.datasetSectionId?._id)) {
        return;
      }
      
      const modelName = model.name.trim();
      model.results.forEach(res => {
        if (res.visible === false) return;
        
        if (!performances[modelName]) {
          performances[modelName] = {
            name: modelName,
            ariScores: [],
            nmiScores: [],
            silScores: [],
            datasetIds: new Set()
          };
        }
        
        const entry = performances[modelName];
        if (res.scoreARI !== undefined && res.scoreARI !== null) entry.ariScores.push(res.scoreARI);
        if (res.scoreNMI !== undefined && res.scoreNMI !== null) entry.nmiScores.push(res.scoreNMI);
        if (res.scoreSilhouette !== undefined && res.scoreSilhouette !== null) entry.silScores.push(res.scoreSilhouette);
        if (model.datasetSectionId?._id) {
          entry.datasetIds.add(model.datasetSectionId._id);
        }
      });
    });

    return Object.values(performances).map(entry => {
      const avgARI = entry.ariScores.length > 0 ? (entry.ariScores.reduce((sum, v) => sum + v, 0) / entry.ariScores.length) : 0;
      const avgNMI = entry.nmiScores.length > 0 ? (entry.nmiScores.reduce((sum, v) => sum + v, 0) / entry.nmiScores.length) : 0;
      const avgSil = entry.silScores.length > 0 ? (entry.silScores.reduce((sum, v) => sum + v, 0) / entry.silScores.length) : 0;
      
      return {
        name: entry.name,
        avgARI,
        avgNMI,
        avgSil,
        datasetCount: entry.datasetIds.size,
        evalCount: entry.ariScores.length + entry.nmiScores.length + entry.silScores.length
      };
    }).sort((a, b) => {
      const valA = metricTab === 'ARI' ? a.avgARI : metricTab === 'NMI' ? a.avgNMI : a.avgSil;
      const valB = metricTab === 'ARI' ? b.avgARI : metricTab === 'NMI' ? b.avgNMI : b.avgSil;
      return valB - valA;
    });
  };

  const overallPerf = getOverallPerformance();

  return (
    <div className="w-full space-y-12">
      {/* Hero Header Section */}
      <div className="text-center py-8 px-4 max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-xs font-bold text-primary font-outfit uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-primary-container animate-pulse" />
          Ablation Benchmarking Suite
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface font-outfit tracking-tight leading-tight">
          Spatial Multi-Omics Leaderboard
        </h1>
        <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          A centralized, clinical-grade benchmark platform designed to track, compare, and display the performance of spatial bioinformatics and multi-omics integration models.
        </p>
      </div>

      {loading ? (
        <div className="space-y-12 animate-pulse">
          {/* Skeleton Card 1 */}
          <div className="bg-surface-container-lowest border border-outline-border rounded-lg p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 to-primary-container/30"></div>
            
            {/* Title Skeleton */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-1.5 h-7 bg-primary-container/20 rounded-full"></div>
              <div className="h-6 bg-surface-container-high rounded w-48"></div>
            </div>
            
            {/* Table Skeleton */}
            <div className="overflow-x-auto rounded-default border border-outline-border bg-surface-container-lowest">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-border h-12">
                    <th className="px-6 py-4 w-20"><div className="h-4 bg-surface-container-high rounded w-8"></div></th>
                    <th className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-32"></div></th>
                    <th className="px-6 py-4 w-24"><div className="h-4 bg-surface-container-high rounded w-16 mx-auto"></div></th>
                    <th className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-20"></div></th>
                    <th className="px-6 py-4 w-20"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></th>
                    <th className="px-6 py-4 w-20"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></th>
                    <th className="px-6 py-4 w-20"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></th>
                    <th className="px-6 py-4 text-right"><div className="h-4 bg-surface-container-high rounded w-12 ml-auto"></div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-border">
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="h-16">
                      <td className="px-6 py-4"><div className="h-6 w-12 bg-surface-container-high rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-40"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-8 mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></td>
                      <td className="px-6 py-4 text-right"><div className="h-4 bg-surface-container-high rounded w-14 ml-auto"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Skeleton Card 2 */}
          <div className="bg-surface-container-lowest border border-outline-border rounded-lg p-6 md:p-8 shadow-sm relative overflow-hidden opacity-60">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 to-primary-container/30"></div>
            
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-1.5 h-7 bg-primary-container/20 rounded-full"></div>
              <div className="h-6 bg-surface-container-high rounded w-36"></div>
            </div>
            
            <div className="overflow-x-auto rounded-default border border-outline-border bg-surface-container-lowest">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-border h-12">
                    <th className="px-6 py-4 w-20"><div className="h-4 bg-surface-container-high rounded w-8"></div></th>
                    <th className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-32"></div></th>
                    <th className="px-6 py-4 w-24"><div className="h-4 bg-surface-container-high rounded w-16 mx-auto"></div></th>
                    <th className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-20"></div></th>
                    <th className="px-6 py-4 w-20"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></th>
                    <th className="px-6 py-4 w-20"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></th>
                    <th className="px-6 py-4 w-20"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></th>
                    <th className="px-6 py-4 text-right"><div className="h-4 bg-surface-container-high rounded w-12 ml-auto"></div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-border">
                  {[1, 2].map((i) => (
                    <tr key={i} className="h-16">
                      <td className="px-6 py-4"><div className="h-6 w-12 bg-surface-container-high rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-40"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-8 mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-10 mx-auto"></div></td>
                      <td className="px-6 py-4 text-right"><div className="h-4 bg-surface-container-high rounded w-14 ml-auto"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : nonEmptySections.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest border border-dashed border-outline-variant rounded-lg max-w-2xl mx-auto p-8 shadow-sm">
          <AlertCircle className="h-12 w-12 text-outline mx-auto mb-4 animate-bounce" />
          <p className="text-lg font-bold text-on-surface">No Benchmark Models Submitted Yet</p>
          <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto leading-relaxed">
            All dataset categories are currently empty. Login or register to submit the first performance entry for scientific validation.
          </p>
          <div className="mt-6">
            <Link 
              href="/submit" 
              className="bg-primary-container hover:bg-primary-container/90 text-white px-6 py-2.5 rounded-default text-sm transition-all font-bold inline-flex items-center gap-2 shadow-sm"
            >
              Submit First Entry
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Overall Performance Chart Card */}
          {overallPerf.length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-border rounded-lg p-6 md:p-8 shadow-sm relative overflow-hidden transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-container to-secondary"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="space-y-1.5">
                  <h2 className="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5 font-outfit">
                    <BarChart3 className="h-5.5 w-5.5 text-primary" />
                    Overall Model Performance
                  </h2>
                  <p className="text-xs text-on-surface-variant leading-normal max-w-xl">
                    Aggregated benchmarks comparison of model submissions across all dataset categories, sorted by their average metric scores.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center self-start md:self-auto">
                  {/* Multi-Select Dataset Checkbox Dropdown */}
                  <div className="relative self-stretch sm:self-auto" ref={filterDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                      className="flex items-center justify-between bg-surface-container-low px-3 py-1.5 rounded-default border border-outline-border text-xs font-bold text-on-surface hover:border-primary cursor-pointer select-none gap-2 self-stretch sm:self-auto min-w-[170px] w-full sm:w-auto"
                    >
                      <span className="truncate max-w-[140px]">
                        {selectedDatasets.length === nonEmptySections.length 
                          ? 'All Datasets Selected' 
                          : selectedDatasets.length === 0 
                          ? 'No Datasets Selected' 
                          : `${selectedDatasets.length} of ${nonEmptySections.length} Datasets`}
                      </span>
                      <ChevronsUpDown className="h-3.5 w-3.5 text-on-surface-variant shrink-0" />
                    </button>

                    {filterDropdownOpen && (
                      <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 z-50 w-64 bg-surface-container-lowest border border-outline-border rounded-default shadow-[0px_4px_20px_rgba(15,23,42,0.08)] overflow-hidden p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[9px] uppercase font-extrabold text-on-surface-variant font-outfit">Filter Datasets</span>
                          <button
                            type="button"
                            onClick={toggleAllDatasets}
                            className="text-[9px] uppercase font-bold text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
                          >
                            {selectedDatasets.length === nonEmptySections.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        
                        <div className="h-px bg-outline-border/60"></div>
                        
                        <ul className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                          {nonEmptySections.map((sec) => {
                            const isChecked = selectedDatasets.includes(sec._id);
                            return (
                              <li key={sec._id}>
                                <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-default hover:bg-surface-container-low cursor-pointer text-xs font-semibold text-on-surface select-none transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleDatasetSelection(sec._id)}
                                    className="h-3.5 w-3.5 accent-primary cursor-pointer rounded border-outline-border"
                                  />
                                  <span className="truncate">{sec.name}</span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Metric Selector Tabs */}
                  <div className="flex bg-surface-container-low p-1 rounded-default border border-outline-border self-stretch sm:self-auto shrink-0 justify-center">
                    {['ARI', 'NMI', 'Silhouette'].map((metric) => {
                      const isActive = metricTab === metric;
                      let activeBtnStyle = 'bg-primary text-white shadow-sm';
                      if (metric === 'NMI') activeBtnStyle = 'bg-secondary text-white shadow-sm';
                      if (metric === 'Silhouette') activeBtnStyle = 'bg-tertiary text-white shadow-sm';
                      
                      return (
                        <button
                          key={metric}
                          type="button"
                          onClick={() => setMetricTab(metric)}
                          className={`px-4 py-1.5 rounded-default text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                            isActive
                              ? activeBtnStyle
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                          }`}
                        >
                          {metric}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Chart Bar List */}
              <div className="space-y-4 max-w-3xl">
                {overallPerf.map((perf, index) => {
                  const score = metricTab === 'ARI' ? perf.avgARI : metricTab === 'NMI' ? perf.avgNMI : perf.avgSil;
                  const percentage = Math.min(Math.max(score * 100, 0), 100);
                  
                  let barColorClass = 'bg-primary';
                  if (metricTab === 'NMI') barColorClass = 'bg-secondary';
                  if (metricTab === 'Silhouette') barColorClass = 'bg-tertiary';

                  return (
                    <div 
                      key={perf.name} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 rounded-default border border-outline-border/40 bg-surface-container-low/20 hover:bg-primary-container/[0.03] hover:border-outline-border transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-[200px] shrink-0">
                        {/* Rank Badge */}
                        <span className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 border ${
                          index === 0 
                            ? 'bg-tertiary-container/10 border-tertiary-container/30 text-tertiary' 
                            : index === 1 
                            ? 'bg-secondary-container text-on-secondary-container border-secondary-container/40' 
                            : index === 2 
                            ? 'bg-surface-container-high text-on-surface-variant border-outline' 
                            : 'bg-surface-container-lowest text-on-surface-variant border-outline-border'
                        }`}>
                          {index === 0 ? (
                            <Trophy className="h-3 w-3 text-tertiary" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-sm font-bold text-on-surface truncate flex items-center gap-1.5">
                            <Cpu className="h-3.5 w-3.5 text-on-surface-variant/70 shrink-0" />
                            {perf.name}
                          </h4>
                          <p className="text-[10px] text-on-surface-variant font-medium">
                            {perf.datasetCount} {perf.datasetCount === 1 ? 'Dataset' : 'Datasets'} Benchmarked
                          </p>
                        </div>
                      </div>

                      {/* Bar Gauge */}
                      <div className="flex-1 w-full">
                        <div className="h-3 bg-surface-container-low rounded-full overflow-hidden border border-outline-border/40 relative shadow-inner">
                          <div 
                            style={{ width: `${percentage}%` }}
                            className={`h-full rounded-full transition-all duration-500 ease-out shadow-xs ${barColorClass}`}
                          ></div>
                        </div>
                      </div>

                      {/* Numeric Value */}
                      <div className="min-w-[64px] text-right font-mono font-bold text-sm text-on-surface shrink-0">
                        {score !== null && score !== undefined ? score.toFixed(3) : '0.000'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {nonEmptySections.map(section => {
            const sectionModels = [];
            models.forEach(model => {
              if (model.datasetSectionId?._id !== section._id) return;
              
              if (model.results && model.results.length > 0) {
                model.results.forEach(res => {
                  if (res.visible === false) return; // Skip if explicitly hidden
                  
                  sectionModels.push({
                    _id: model._id,
                    resultKey: `${model._id}-${res.clusterSize}`,
                    name: model.name,
                    authorId: model.authorId,
                    clusterSize: res.clusterSize,
                    scoreARI: res.scoreARI,
                    scoreNMI: res.scoreNMI,
                    scoreSilhouette: res.scoreSilhouette,
                    scoreAMI: res.scoreAMI,
                    scoreHomogeneity: res.scoreHomogeneity,
                    scoreVMeasure: res.scoreVMeasure
                  });
                });
              } else {
                sectionModels.push({
                  _id: model._id,
                  resultKey: `${model._id}-legacy`,
                  name: model.name,
                  authorId: model.authorId,
                  clusterSize: model.clusterSize,
                  scoreARI: model.scoreARI,
                  scoreNMI: model.scoreNMI,
                  scoreSilhouette: model.scoreSilhouette,
                  scoreAMI: model.scoreAMI,
                  scoreHomogeneity: model.scoreHomogeneity,
                  scoreVMeasure: model.scoreVMeasure
                });
              }
            });

            // Sort by ARI descending, fall back to NMI, then Silhouette
            sectionModels.sort((a, b) => {
              const valA = a.scoreARI !== undefined && a.scoreARI !== null ? a.scoreARI : -1;
              const valB = b.scoreARI !== undefined && b.scoreARI !== null ? b.scoreARI : -1;
              if (valB !== valA) return valB - valA;
              
              const nmiA = a.scoreNMI !== undefined && a.scoreNMI !== null ? a.scoreNMI : -1;
              const nmiB = b.scoreNMI !== undefined && b.scoreNMI !== null ? b.scoreNMI : -1;
              if (nmiB !== nmiA) return nmiB - nmiA;
              
              const silA = a.scoreSilhouette !== undefined && a.scoreSilhouette !== null ? a.scoreSilhouette : -1;
              const silB = b.scoreSilhouette !== undefined && b.scoreSilhouette !== null ? b.scoreSilhouette : -1;
              return silB - silA;
            });

            return (
              <div 
                key={section._id} 
                className="bg-surface-container-lowest border border-outline-border rounded-lg p-6 md:p-8 shadow-sm transition-colors duration-300 relative overflow-hidden"
              >
                {/* Visual anchor bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-container"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5 font-outfit">
                    <span className="w-1.5 h-7 bg-primary-container rounded-full inline-block"></span>
                    Dataset: {section.name}
                  </h2>
                  {section.groundTruth !== undefined && section.groundTruth !== null && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary/10 border border-tertiary/20 rounded-full text-xs font-bold text-tertiary font-outfit uppercase shrink-0 w-fit">
                      Ground Truth: {section.groundTruth} Clusters
                    </span>
                  )}
                </div>
                
                <div className="overflow-x-auto rounded-default border border-outline-border bg-surface-container-lowest">
                  <table className="w-full text-left text-sm text-on-surface-variant border-collapse">
                    <thead className="bg-surface-container-low border-b border-outline-border text-xs uppercase font-semibold text-on-surface-variant tracking-wider font-outfit">
                      <tr>
                        <th className="px-3 sm:px-6 py-3.5 sm:py-4 w-16 sm:w-20">Rank</th>
                        <th className="px-3 sm:px-6 py-3.5 sm:py-4">Model Name</th>
                        <th className="px-3 sm:px-6 py-3.5 sm:py-4 font-semibold text-center w-24">Clusters</th>
                        <th className="px-3 sm:px-6 py-3.5 sm:py-4">Author</th>
                        <th className="px-3 sm:px-6 py-3.5 sm:py-4 font-bold text-primary text-center">ARI</th>
                        <th className="px-3 sm:px-6 py-3.5 sm:py-4 font-bold text-secondary text-center">NMI</th>
                        <th className="px-3 sm:px-6 py-3.5 sm:py-4 font-bold text-tertiary text-center">Silh.</th>
                        <th className="px-3 sm:px-6 py-3.5 sm:py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-border">
                      {sectionModels.map((model, index) => (
                        <tr 
                          key={model.resultKey} 
                          className="hover:bg-primary-container/[0.04] transition-all group relative"
                        >
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold relative">
                            {/* Hover Selection bar */}
                            <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity"></span>
                            
                            {index === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-tertiary-container/10 text-tertiary border border-tertiary-container/30">
                                <Trophy className="h-3 w-3 text-tertiary animate-pulse" />
                                1st
                              </span>
                            ) : index === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-secondary-container text-on-secondary-container border border-secondary-container/40">
                                <Medal className="h-3 w-3" />
                                2nd
                              </span>
                            ) : index === 2 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-surface-container-high text-on-surface-variant border border-outline">
                                <Medal className="h-3 w-3 text-amber-700" />
                                3rd
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[10px] sm:text-xs font-bold bg-surface-container-low text-on-surface-variant border border-outline-border">
                                {index + 1}
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-on-surface">
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                              <Cpu className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-container/85 shrink-0" />
                              <span className="truncate max-w-[120px] sm:max-w-none">{model.name}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono font-bold text-center text-xs sm:text-sm text-secondary">
                            {model.clusterSize !== undefined && model.clusterSize !== null ? model.clusterSize : '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium">{model.authorId?.name || 'Unknown'}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-primary font-bold text-center text-xs sm:text-sm">
                            {model.scoreARI !== undefined && model.scoreARI !== null ? model.scoreARI.toFixed(3) : '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-secondary font-bold text-center text-xs sm:text-sm">
                            {model.scoreNMI !== undefined && model.scoreNMI !== null ? model.scoreNMI.toFixed(3) : '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-tertiary font-bold text-center text-xs sm:text-sm">
                            {model.scoreSilhouette !== undefined && model.scoreSilhouette !== null ? model.scoreSilhouette.toFixed(3) : '-'}
                          </td>

                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                            <Link 
                              href={`/models/${model._id}`}
                              className="inline-flex items-center gap-0.5 sm:gap-1 text-primary-container hover:text-primary font-bold text-xs sm:text-sm transition-colors group/btn"
                            >
                              Details
                              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover/btn:translate-x-1" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
