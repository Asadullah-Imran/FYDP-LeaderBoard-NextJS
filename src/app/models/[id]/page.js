'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import { useAuth } from '@/context/AuthContext';
import { usePopup } from '@/context/PopupContext';
import { useData } from '@/context/DataContext';
import { Edit2, Trash2, Check, X, Eye, Edit3, ChevronsUpDown, Search, Image, ArrowLeft, Cpu, Layers, BookOpen, AlertTriangle, Code, ExternalLink, Info } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const parseRawMetrics = (text) => {
  const regex = /(ari|nmi|ami|silhouette|silh|sil|homogeneity|homo|v-measure|vmeasure|v\s+measure|cluster\s+size|cluster_size|clusters?)\s*[:=\s]\s*([0-9.]+)/gi;
  const result = {};
  
  const keyMapping = {
    ari: 'scoreARI',
    nmi: 'scoreNMI',
    silhouette: 'scoreSilhouette',
    silh: 'scoreSilhouette',
    sil: 'scoreSilhouette',
    ami: 'scoreAMI',
    homogeneity: 'scoreHomogeneity',
    homo: 'scoreHomogeneity',
    'v-measure': 'scoreVMeasure',
    vmeasure: 'scoreVMeasure',
    'v measure': 'scoreVMeasure',
    cluster: 'clusterSize',
    clusters: 'clusterSize',
    'cluster size': 'clusterSize',
    'cluster_size': 'clusterSize',
  };

  let match;
  while ((match = regex.exec(text)) !== null) {
    const rawKey = match[1].toLowerCase().replace(/\s+/g, ' ');
    const val = parseFloat(match[2]);
    if (!isNaN(val)) {
      for (const [key, field] of Object.entries(keyMapping)) {
        if (rawKey === key || rawKey.includes(key)) {
          result[field] = val;
          break;
        }
      }
    }
  }
  return result;
};

export default function ModelDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert, showConfirm } = usePopup();
  const { 
    modelDetails, 
    getModelDetail, 
    updateModelInCache, 
    deleteModelFromCache, 
    fetchGlobalData, 
    sections 
  } = useData();

  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editTab, setEditTab] = useState('write'); // 'write' | 'preview'
  const [imageFiles, setImageFiles] = useState([]);
  const [editData, setEditData] = useState({
    name: '',
    descriptionMarkdown: '',
    architectureFlow: '',
    datasetSectionId: '',
    methodologyImages: [],
    githubUrl: '',
  });

  const [editResults, setEditResults] = useState([]);

  // Searchable dropdown inside edit mode
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      // If the model is already in cache, load it immediately so the user doesn't see a spinner
      if (modelDetails[id]) {
        setModel(modelDetails[id]);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        // Fetch model detail (updates cache and returns data)
        const modelData = await getModelDetail(id, true);
        if (active) {
          setModel(modelData);
          setLoading(false);
        }
        
        // Ensure sections are loaded (uses cache if available)
        await fetchGlobalData();
      } catch (error) {
        console.error('Error loading model details:', error);
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (model?.architectureFlow && !isEditing) {
      try {
        // Initialize mermaid with simple styling compatible with light mode
        mermaid.initialize({ 
          startOnLoad: true, 
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Inter'
        });
        mermaid.contentLoaded();
      } catch (e) {
        console.error('Mermaid render error:', e);
      }
    }
  }, [model, isEditing]);

  // Click outside to close dropdown in edit mode
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-medium text-sm animate-pulse">Loading model blueprint details...</p>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="text-center py-16 bg-surface-container-lowest border border-outline-border rounded-lg max-w-md mx-auto p-6 shadow-sm">
        <AlertTriangle className="h-10 w-10 text-error mx-auto mb-3" />
        <p className="text-lg font-bold text-on-surface">Benchmark Model Not Found</p>
        <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
          The requested submission record does not exist or has been removed from the registry.
        </p>
        <Link href="/" className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="h-3 w-3" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const canManage = user && (user._id === model.authorId?._id || user._id === model.authorId || user.role === 'admin');

  const startEditing = () => {
    setEditData({
      name: model.name,
      descriptionMarkdown: model.descriptionMarkdown,
      architectureFlow: model.architectureFlow || '',
      datasetSectionId: model.datasetSectionId?._id || model.datasetSectionId,
      methodologyImages: model.methodologyImages || [],
      githubUrl: model.githubUrl || ''
    });

    const initialResults = model.results && model.results.length > 0
      ? model.results.map(res => ({
          clusterSize: res.clusterSize !== undefined && res.clusterSize !== null ? res.clusterSize.toString() : '',
          scoreARI: res.scoreARI !== undefined && res.scoreARI !== null ? res.scoreARI.toString() : '',
          scoreNMI: res.scoreNMI !== undefined && res.scoreNMI !== null ? res.scoreNMI.toString() : '',
          scoreSilhouette: res.scoreSilhouette !== undefined && res.scoreSilhouette !== null ? res.scoreSilhouette.toString() : '',
          scoreAMI: res.scoreAMI !== undefined && res.scoreAMI !== null ? res.scoreAMI.toString() : '',
          scoreHomogeneity: res.scoreHomogeneity !== undefined && res.scoreHomogeneity !== null ? res.scoreHomogeneity.toString() : '',
          scoreVMeasure: res.scoreVMeasure !== undefined && res.scoreVMeasure !== null ? res.scoreVMeasure.toString() : '',
        }))
      : [{
          clusterSize: model.clusterSize !== undefined && model.clusterSize !== null ? model.clusterSize.toString() : '',
          scoreARI: model.scoreARI !== undefined && model.scoreARI !== null ? model.scoreARI.toString() : '',
          scoreNMI: model.scoreNMI !== undefined && model.scoreNMI !== null ? model.scoreNMI.toString() : '',
          scoreSilhouette: model.scoreSilhouette !== undefined && model.scoreSilhouette !== null ? model.scoreSilhouette.toString() : '',
          scoreAMI: model.scoreAMI !== undefined && model.scoreAMI !== null ? model.scoreAMI.toString() : '',
          scoreHomogeneity: model.scoreHomogeneity !== undefined && model.scoreHomogeneity !== null ? model.scoreHomogeneity.toString() : '',
          scoreVMeasure: model.scoreVMeasure !== undefined && model.scoreVMeasure !== null ? model.scoreVMeasure.toString() : '',
        }];

    setEditResults(initialResults);
    setImageFiles([]);
    setIsEditing(true);
    setEditTab('write');
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditResultChange = (index, field, value) => {
    setEditResults((prev) =>
      prev.map((res, i) => (i === index ? { ...res, [field]: value } : res))
    );
  };

  const handleAddEditResult = () => {
    setEditResults((prev) => [
      {
        clusterSize: '',
        scoreARI: '',
        scoreNMI: '',
        scoreSilhouette: '',
        scoreAMI: '',
        scoreHomogeneity: '',
        scoreVMeasure: ''
      },
      ...prev
    ]);
  };

  const handleRemoveEditResult = (index) => {
    if (editResults.length <= 1) return;
    setEditResults((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveLocalImage = (indexToRemove) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveExistingImage = (idxToRemove) => {
    setEditData(prev => ({
      ...prev,
      methodologyImages: prev.methodologyImages.filter((_, idx) => idx !== idxToRemove)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      let finalImages = [...editData.methodologyImages];

      // Upload new images concurrently if selected
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const imageData = new FormData();
          imageData.append('image', file);
          
          const uploadRes = await axios.post(`${API_URL}/upload`, imageData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          });
          return uploadRes.data.url;
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        finalImages = [...finalImages, ...uploadedUrls];
      }

      // Validation
      if (editResults.length === 0) {
        await showAlert('Validation Error', 'You must provide at least one cluster size evaluation.', 'warning');
        setIsSaving(false);
        return;
      }

      const parsedResults = [];
      const seenClusterSizes = new Set();

      for (let i = 0; i < editResults.length; i++) {
        const res = editResults[i];
        
        if (!res.clusterSize || isNaN(parseInt(res.clusterSize)) || parseInt(res.clusterSize) <= 0) {
          await showAlert('Validation Error', `Cluster size for evaluation #${i + 1} must be a valid positive integer.`, 'warning');
          setIsSaving(false);
          return;
        }

        const sizeVal = parseInt(res.clusterSize);
        if (seenClusterSizes.has(sizeVal)) {
          await showAlert('Validation Error', `Duplicate cluster size ${sizeVal} detected in evaluations.`, 'warning');
          setIsSaving(false);
          return;
        }
        seenClusterSizes.add(sizeVal);

        const scoreARIVal = res.scoreARI !== '' ? parseFloat(res.scoreARI) : undefined;
        const scoreNMIVal = res.scoreNMI !== '' ? parseFloat(res.scoreNMI) : undefined;
        const scoreSilhouetteVal = res.scoreSilhouette !== '' ? parseFloat(res.scoreSilhouette) : undefined;

        let count = 0;
        if (scoreARIVal !== undefined && !isNaN(scoreARIVal)) count++;
        if (scoreNMIVal !== undefined && !isNaN(scoreNMIVal)) count++;
        if (scoreSilhouetteVal !== undefined && !isNaN(scoreSilhouetteVal)) count++;

        if (count < 2) {
          await showAlert('Validation Error', `Evaluation with Cluster Size ${sizeVal} must have at least two of the primary metrics (ARI, NMI, Silhouette).`, 'warning');
          setIsSaving(false);
          return;
        }

        parsedResults.push({
          clusterSize: sizeVal,
          scoreARI: scoreARIVal,
          scoreNMI: scoreNMIVal,
          scoreSilhouette: scoreSilhouetteVal,
          scoreAMI: res.scoreAMI !== '' ? parseFloat(res.scoreAMI) : undefined,
          scoreHomogeneity: res.scoreHomogeneity !== '' ? parseFloat(res.scoreHomogeneity) : undefined,
          scoreVMeasure: res.scoreVMeasure !== '' ? parseFloat(res.scoreVMeasure) : undefined,
        });
      }

      const payload = {
        ...editData,
        results: parsedResults,
        methodologyImages: finalImages
      };

      const { data } = await axios.put(`${API_URL}/models/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setModel(data);
      updateModelInCache(data);
      setIsEditing(false);
      setImageFiles([]);
    } catch (error) {
      console.error('Error updating model:', error);
      const errMsg = error.response?.data?.message || 'Failed to update model. Please check authorization.';
      await showAlert('Update Failed', errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      'Confirm Deletion',
      'Are you absolutely sure you want to delete this model submission? This action cannot be undone.',
      'danger'
    );
    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/models/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      deleteModelFromCache(id);
      router.push('/');
    } catch (error) {
      console.error('Error deleting model:', error);
      await showAlert('Deletion Failed', 'Failed to delete the model record from the database registry.', 'error');
    }
  };

  const displayResults = model ? [...(model.results && model.results.length > 0 ? model.results : [{
    clusterSize: model.clusterSize,
    scoreARI: model.scoreARI,
    scoreNMI: model.scoreNMI,
    scoreSilhouette: model.scoreSilhouette,
    scoreAMI: model.scoreAMI,
    scoreHomogeneity: model.scoreHomogeneity,
    scoreVMeasure: model.scoreVMeasure
  }])].sort((a, b) => {
    const ariA = a.scoreARI !== undefined && a.scoreARI !== null ? a.scoreARI : -1;
    const ariB = b.scoreARI !== undefined && b.scoreARI !== null ? b.scoreARI : -1;
    if (ariB !== ariA) return ariB - ariA;
    
    const silA = a.scoreSilhouette !== undefined && a.scoreSilhouette !== null ? a.scoreSilhouette : -1;
    const silB = b.scoreSilhouette !== undefined && b.scoreSilhouette !== null ? b.scoreSilhouette : -1;
    return silB - silA;
  }) : [];

  const selectedSection = sections.find(s => s._id === editData.datasetSectionId);
  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <button 
          onClick={() => router.push('/')}
          className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 font-bold text-sm bg-transparent cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        
        {/* Author management options */}
        {canManage && !isEditing && (
          <div className="flex items-center gap-3">
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface px-4 py-2 rounded-default text-xs md:text-sm font-bold transition-all border border-outline-border cursor-pointer shadow-sm"
            >
              <Edit2 className="h-3.5 w-3.5 text-primary" />
              Edit Model
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 bg-error-container/20 hover:bg-error-container hover:text-error text-error px-4 py-2 rounded-default text-xs md:text-sm font-bold transition-all border border-error-container/30 cursor-pointer shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Record
            </button>
          </div>
        )}

        {!user && (
          <div className="text-xs text-on-surface-variant bg-surface-container-low border border-outline-border px-3.5 py-1.5 rounded-default flex items-center gap-1.5 shadow-sm">
            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              Want to submit or edit models?{' '}
              <Link href="/login" className="text-primary hover:underline font-bold transition-colors">
                Login
              </Link>{' '}
              or{' '}
              <button 
                onClick={() => router.push('/login?register=true')} 
                className="text-primary hover:underline font-bold bg-transparent border-0 p-0 cursor-pointer transition-colors inline font-sans text-xs"
              >
                Register
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-lg p-5 sm:p-8 border border-outline-border shadow-sm relative overflow-hidden transition-all duration-300">
        {/* Visual anchor bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-primary-container"></div>
        
        {!isEditing ? (
          /* STATIC DISPLAY VIEW */
          <div className="space-y-10">
            <div className="flex flex-col gap-6 border-b border-outline-border pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-container/10 text-primary border border-primary-container/20 font-outfit">
                    Bioinformatics Model
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface font-outfit tracking-tight flex items-center gap-2">
                  <Cpu className="h-8 w-8 text-primary-container" />
                  {model.name}
                </h1>
                <div className="text-sm text-on-surface-variant flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="flex flex-wrap items-center gap-1">
                    Submitted by <span className="text-on-surface font-bold">{model.authorId?.name || 'Unknown'}</span> for dataset 
                    <span className="text-primary font-bold">{model.datasetSectionId?.name || 'Deleted Section'}</span>
                    {model.datasetSectionId?.groundTruth !== undefined && model.datasetSectionId?.groundTruth !== null && (
                      <span className="ml-1.5 px-2 py-0.5 bg-tertiary-container/10 border border-tertiary-container/30 text-tertiary text-[10px] font-bold uppercase rounded-full tracking-wider font-outfit">
                        Ground Truth: {model.datasetSectionId.groundTruth} Clusters
                      </span>
                    )}
                  </span>
                  {model.githubUrl && (
                    <>
                      <span className="text-outline-border text-xs">•</span>
                      <a 
                        href={model.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1 text-primary hover:text-primary-container font-bold text-xs"
                      >
                        <Code className="h-3.5 w-3.5" />
                        Source Code
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Cluster Size Evaluations List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-outfit flex items-center gap-1">
                  <Layers className="h-4 w-4 text-primary" />
                  Cluster Size Evaluations
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {displayResults.map((res, index) => (
                    <div key={index} className="bg-surface-container-low border border-outline-border/60 rounded-default p-4.5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center border-b border-outline-border/40 pb-2">
                        <span className="text-xs font-bold text-primary font-outfit uppercase tracking-wider">
                          Evaluation Config: {res.clusterSize} Clusters
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 w-full">
                        <div className="bg-surface-container-lowest border border-outline-border/60 rounded-default p-3 text-center">
                          <div className="text-[9px] text-primary uppercase font-extrabold tracking-wider mb-1 font-outfit">ARI Score</div>
                          <div className="text-lg font-mono text-primary font-extrabold">
                            {res.scoreARI !== undefined && res.scoreARI !== null ? res.scoreARI.toFixed(3) : '-'}
                          </div>
                        </div>

                        <div className="bg-surface-container-lowest border border-outline-border/60 rounded-default p-3 text-center">
                          <div className="text-[9px] text-secondary uppercase font-extrabold tracking-wider mb-1 font-outfit">NMI Score</div>
                          <div className="text-lg font-mono text-secondary font-extrabold">
                            {res.scoreNMI !== undefined && res.scoreNMI !== null ? res.scoreNMI.toFixed(3) : '-'}
                          </div>
                        </div>

                        <div className="bg-surface-container-lowest border border-outline-border/60 rounded-default p-3 text-center">
                          <div className="text-[9px] text-tertiary uppercase font-extrabold tracking-wider mb-1 font-outfit">Silhouette</div>
                          <div className="text-lg font-mono text-tertiary font-extrabold">
                            {res.scoreSilhouette !== undefined && res.scoreSilhouette !== null ? res.scoreSilhouette.toFixed(3) : '-'}
                          </div>
                        </div>

                        <div className={`bg-surface-container-lowest border border-outline-border/60 rounded-default p-3 text-center ${res.scoreAMI === undefined || res.scoreAMI === null ? 'opacity-40' : ''}`}>
                          <div className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-extrabold tracking-wider mb-1 font-outfit">AMI Score</div>
                          <div className="text-lg font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                            {res.scoreAMI !== undefined && res.scoreAMI !== null ? res.scoreAMI.toFixed(3) : '-'}
                          </div>
                        </div>

                        <div className={`bg-surface-container-lowest border border-outline-border/60 rounded-default p-3 text-center ${res.scoreHomogeneity === undefined || res.scoreHomogeneity === null ? 'opacity-40' : ''}`}>
                          <div className="text-[9px] text-amber-600 dark:text-amber-500 uppercase font-extrabold tracking-wider mb-1 font-outfit">Homogeneity</div>
                          <div className="text-lg font-mono text-amber-600 dark:text-amber-500 font-extrabold">
                            {res.scoreHomogeneity !== undefined && res.scoreHomogeneity !== null ? res.scoreHomogeneity.toFixed(3) : '-'}
                          </div>
                        </div>

                        <div className={`bg-surface-container-lowest border border-outline-border/60 rounded-default p-3 text-center ${res.scoreVMeasure === undefined || res.scoreVMeasure === null ? 'opacity-40' : ''}`}>
                          <div className="text-[9px] text-purple-600 dark:text-purple-400 uppercase font-extrabold tracking-wider mb-1 font-outfit">V-Measure</div>
                          <div className="text-lg font-mono text-purple-600 dark:text-purple-400 font-extrabold">
                            {res.scoreVMeasure !== undefined && res.scoreVMeasure !== null ? res.scoreVMeasure.toFixed(3) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Methodology Prose Section */}
            <div className="prose max-w-none">
              <h2 className="text-xl font-bold font-outfit border-b border-outline-border pb-2.5 mb-6 text-on-surface flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-container" />
                Mathematical Methodology
              </h2>
              <div className="text-on-surface-variant leading-relaxed text-sm space-y-4">
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {model.descriptionMarkdown}
                </ReactMarkdown>
              </div>
            </div>

            {/* Architecture Flow Diagram */}
            {model.architectureFlow && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-outfit border-b border-outline-border pb-2.5 mb-6 text-on-surface flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary-container" />
                  Model Pipeline Graph
                </h2>
                <div className="bg-surface-container-low p-6 rounded-default border border-outline-border overflow-x-auto flex justify-center shadow-sm">
                  <div className="mermaid bg-transparent">
                    {model.architectureFlow}
                  </div>
                </div>
              </div>
            )}

            {/* Gallery / Methodology Images */}
            {model.methodologyImages && model.methodologyImages.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-outfit border-b border-outline-border pb-2.5 mb-6 text-on-surface flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary-container" />
                  Methodology Gallery
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {model.methodologyImages.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt={`Methodology Formulation ${idx + 1}`} 
                      className="rounded-default border border-outline-border w-full object-cover max-h-80 hover:scale-[1.01] transition-all shadow-sm cursor-zoom-in"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* DYNAMIC EDIT FORM VIEW */
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex justify-between items-center border-b border-outline-border pb-4 mb-6">
              <h2 className="text-xl font-bold text-on-surface font-outfit">Edit Model Submission</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface px-3.5 py-1.5 rounded-default text-xs md:text-sm font-bold transition-all border border-outline-border cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-primary-container hover:bg-primary-container/90 text-white px-4 py-1.5 rounded-default text-xs md:text-sm font-bold transition-all border border-primary-container cursor-pointer shadow-sm disabled:opacity-70"
                >
                  <Check className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit">Model Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={editData.name} 
                  onChange={handleEditChange} 
                  required
                  className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-sm font-semibold"
                />
              </div>
              
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit">Dataset Section</label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface hover:border-primary-container focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-sm font-semibold text-left cursor-pointer"
                >
                  <span className="truncate">
                    {selectedSection ? selectedSection.name : 'Select a dataset section...'}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 text-on-surface-variant shrink-0 ml-2" />
                </button>

                {dropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-surface-container-lowest border border-outline-border rounded-default shadow-[0px_4px_20px_rgba(15,23,42,0.08)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="p-2.5 border-b border-outline-border flex items-center gap-2 bg-surface-container-low">
                      <Search className="h-4 w-4 text-on-surface-variant shrink-0" />
                      <input
                        type="text"
                        placeholder="Search dataset sections..."
                        value={dropdownSearch}
                        onChange={(e) => setDropdownSearch(e.target.value)}
                        className="w-full bg-transparent text-sm text-on-surface focus:outline-none placeholder-on-surface-variant/40"
                        autoFocus
                      />
                    </div>
                    <ul className="max-h-60 overflow-y-auto py-1 divide-y divide-outline-border/50">
                      {filteredSections.length > 0 ? (
                        filteredSections.map((section) => {
                          const isSelected = section._id === editData.datasetSectionId;
                          return (
                            <li key={section._id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditData((prev) => ({ ...prev, datasetSectionId: section._id }));
                                  setDropdownOpen(false);
                                  setDropdownSearch('');
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-primary-container/10 text-primary font-bold'
                                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                                }`}
                              >
                                <span className="truncate">{section.name}</span>
                                {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                              </button>
                            </li>
                          );
                        })
                      ) : (
                        <li className="px-4 py-3 text-xs text-on-surface-variant text-center italic">
                          No matching sections found
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Evaluations Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-outline-border/60 pb-2">
                <h3 className="text-sm font-bold text-on-surface font-outfit flex items-center gap-1.5">
                  <span className="w-1.5 h-4.5 bg-primary rounded-full inline-block"></span>
                  Cluster Size Evaluations ({editResults.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddEditResult}
                  className="inline-flex items-center gap-1.5 bg-primary-container hover:bg-primary-container/90 text-white font-bold px-3 py-1.5 rounded-default text-xs cursor-pointer transition-colors shadow-sm"
                >
                  + Add Cluster Evaluation
                </button>
              </div>

              <div className="space-y-6">
                {editResults.map((res, index) => (
                  <div key={index} className="bg-surface-container-low/30 p-5 rounded-default border border-outline-border/60 relative space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary font-outfit uppercase tracking-wider">
                        Evaluation #{index + 1}
                      </span>
                      {editResults.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditResult(index)}
                          className="inline-flex items-center gap-1 text-xs text-error hover:text-error/85 font-bold bg-transparent cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit">Number of Clusters</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 9"
                          value={res.clusterSize} 
                          onChange={(e) => handleEditResultChange(index, 'clusterSize', e.target.value)} 
                          required
                          min="1"
                          className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-sm font-semibold font-mono"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-primary mb-1.5 font-outfit">Quick Metrics Paste (Autofill)</label>
                        <textarea
                          rows={1}
                          placeholder="Paste output (e.g. ARI: 0.1885 NMI: 0.3351) here to auto-fill..."
                          className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-xs font-mono resize-none h-[38px] leading-tight"
                          onChange={(e) => {
                            const parsed = parseRawMetrics(e.target.value);
                            if (Object.keys(parsed).length > 0) {
                              Object.entries(parsed).forEach(([field, val]) => {
                                handleEditResultChange(index, field, val.toString());
                              });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="border-t border-outline-border/40 pt-4 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface font-outfit">
                          Primary Performance Metrics (At least 2 required)
                        </h4>
                        <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                          Provide at least two of ARI, NMI, or Silhouette.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit">ARI Score</label>
                          <input 
                            type="number" 
                            step="0.0001" 
                            placeholder="0.000"
                            value={res.scoreARI} 
                            onChange={(e) => handleEditResultChange(index, 'scoreARI', e.target.value)} 
                            className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-sm font-mono"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit">NMI Score</label>
                          <input 
                            type="number" 
                            step="0.0001" 
                            placeholder="0.000"
                            value={res.scoreNMI} 
                            onChange={(e) => handleEditResultChange(index, 'scoreNMI', e.target.value)} 
                            className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-sm font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit">Silhouette Score</label>
                          <input 
                            type="number" 
                            step="0.0001" 
                            placeholder="0.000"
                            value={res.scoreSilhouette} 
                            onChange={(e) => handleEditResultChange(index, 'scoreSilhouette', e.target.value)} 
                            className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-outline-border/40 pt-4 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface font-outfit">
                          Secondary Benchmarks (Optional)
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit">AMI Score</label>
                          <input 
                            type="number" 
                            step="0.0001" 
                            placeholder="0.000"
                            value={res.scoreAMI} 
                            onChange={(e) => handleEditResultChange(index, 'scoreAMI', e.target.value)} 
                            className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-sm font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit">Homogeneity</label>
                          <input 
                            type="number" 
                            step="0.0001" 
                            placeholder="0.000"
                            value={res.scoreHomogeneity} 
                            onChange={(e) => handleEditResultChange(index, 'scoreHomogeneity', e.target.value)} 
                            className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-sm font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit">V-Measure</label>
                          <input 
                            type="number" 
                            step="0.0001" 
                            placeholder="0.000"
                            value={res.scoreVMeasure} 
                            onChange={(e) => handleEditResultChange(index, 'scoreVMeasure', e.target.value)} 
                            className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant font-outfit flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-primary-container" />
                  Methodology Explanation (Markdown + LaTeX)
                </label>
                <div className="flex bg-surface-container-low p-0.5 rounded-default border border-outline-border">
                  <button
                    type="button"
                    onClick={() => setEditTab('write')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-default text-xs font-bold cursor-pointer transition-all ${
                      editTab === 'write'
                        ? 'bg-primary-container text-white shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Edit3 className="h-3 w-3" />
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTab('preview')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-default text-xs font-bold cursor-pointer transition-all ${
                      editTab === 'preview'
                        ? 'bg-primary-container text-white shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                </div>
              </div>
              
              {editTab === 'write' ? (
                <textarea 
                  name="descriptionMarkdown" 
                  value={editData.descriptionMarkdown} 
                  onChange={handleEditChange} 
                  required 
                  rows={8}
                  className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all font-mono text-sm leading-relaxed"
                ></textarea>
              ) : (
                <div className="w-full bg-surface-container-low border border-outline-border rounded-default p-6 min-h-[178px] prose dark:prose-invert text-on-surface max-w-none overflow-y-auto">
                  {editData.descriptionMarkdown.trim() ? (
                    <div className="leading-relaxed text-sm">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {editData.descriptionMarkdown}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-on-surface-variant italic text-xs text-center pt-10 flex flex-col items-center gap-2">
                      <Info className="h-5 w-5 text-on-surface-variant/40" />
                      Nothing to preview. Select the 'Editor' tab to add methodology text.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* methodology images management */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit flex items-center gap-1.5">
                <Image className="h-4 w-4 text-primary-container" />
                Existing Methodology Gallery
              </label>
              
              {editData.methodologyImages && editData.methodologyImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {editData.methodologyImages.map((img, idx) => (
                    <div key={idx} className="relative group border border-outline-border rounded-default overflow-hidden h-24 bg-surface-container-low shadow-sm">
                      <img src={img} alt={`Existing Upload ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(idx)}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-error-container font-extrabold text-xs cursor-pointer gap-1"
                      >
                        <Trash2 className="h-4 w-4 text-error" />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant italic mb-4">No images currently in gallery.</p>
              )}

              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit flex items-center gap-1.5">
                <Image className="h-4 w-4 text-primary-container" />
                Upload New Images (Gallery Upload) - Multiple Allowed
              </label>

              {imageFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {imageFiles.map((file, idx) => {
                    const localUrl = URL.createObjectURL(file);
                    return (
                      <div key={idx} className="relative group border border-outline-border rounded-default overflow-hidden h-24 bg-surface-container-low shadow-sm">
                        <img src={localUrl} alt={`New Selected Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveLocalImage(idx)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-error-container font-extrabold text-xs cursor-pointer gap-1"
                        >
                          <Trash2 className="h-4 w-4 text-error" />
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <input 
                type="file" 
                onChange={handleImageChange} 
                accept="image/*"
                multiple
                className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface text-sm file:mr-4 file:py-1.5 file:px-3.5 file:rounded-default file:border-0 file:text-xs file:font-bold file:bg-primary-container file:text-white hover:file:bg-primary-container/90 transition-colors cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit flex items-center gap-1.5">
                <Code className="h-4 w-4 text-primary-container" />
                GitHub Repository (Source Code) - Optional
              </label>
              <input 
                type="url" 
                name="githubUrl" 
                placeholder="e.g. https://github.com/username/project-repo"
                value={editData.githubUrl} 
                onChange={handleEditChange} 
                className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-outfit">Architecture Flow (Mermaid.js Scheme) - Optional</label>
              <textarea 
                name="architectureFlow" 
                value={editData.architectureFlow} 
                onChange={handleEditChange} 
                rows={4}
                className="w-full bg-surface-container-lowest border border-outline-border rounded-default px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all font-mono text-xs leading-relaxed"
              ></textarea>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
