'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Medal, ArrowRight, Sparkles, AlertCircle, Cpu } from 'lucide-react';
import { useData } from '@/context/DataContext';

export default function Dashboard() {
  const { sections, models, globalLoading: loading, fetchGlobalData } = useData();

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const nonEmptySections = sections.filter(section => 
    models.some(m => m.datasetSectionId?._id === section._id)
  );

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
