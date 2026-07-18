import mongoose from 'mongoose';
import './User';
import './DatasetSection';

const clusterResultSchema = new mongoose.Schema({
  clusterSize: { type: Number, required: true },
  scoreARI: { type: Number },
  scoreNMI: { type: Number },
  scoreSilhouette: { type: Number },
  scoreAMI: { type: Number },
  scoreHomogeneity: { type: Number },
  scoreVMeasure: { type: Number },
  visible: { type: Boolean, default: true }
}, { _id: false });

const modelSubmissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  datasetSectionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DatasetSection', 
    required: true 
  },
  
  // Multiple evaluations by cluster size
  results: {
    type: [clusterResultSchema],
    required: true,
    validate: [v => Array.isArray(v) && v.length > 0, 'At least one cluster size result is required']
  },

  // Legacy Fields (kept for backward compatibility with older database submissions)
  scoreARI: { type: Number },
  scoreNMI: { type: Number },
  scoreSilhouette: { type: Number },
  scoreAMI: { type: Number },
  scoreHomogeneity: { type: Number },
  scoreVMeasure: { type: Number },
  clusterSize: { type: Number },
  
  // Parsed Artifacts & Uploads
  descriptionMarkdown: { type: String, required: true }, // Markdown + LaTeX content
  methodologyImages: [{ type: String }], // Array of image URLs for methodology
  architectureFlow: { type: String }, // Optional Mermaid.js syntax content
  githubUrl: { type: String }, // Optional link to source code
  colabUrl: { type: String }, // Optional link to Google Colab Notebook
  kaggleUrl: { type: String }, // Optional link to Kaggle Notebook
  paperUrl: { type: String }, // Optional link to scientific research publication
}, { timestamps: true });

// Backward compatibility fallback on loading legacy documents
modelSubmissionSchema.post('init', function(doc) {
  if ((!doc.results || doc.results.length === 0) && doc.clusterSize !== undefined) {
    doc.results = [{
      clusterSize: doc.clusterSize,
      scoreARI: doc.scoreARI,
      scoreNMI: doc.scoreNMI,
      scoreSilhouette: doc.scoreSilhouette,
      scoreAMI: doc.scoreAMI,
      scoreHomogeneity: doc.scoreHomogeneity,
      scoreVMeasure: doc.scoreVMeasure,
      visible: true
    }];
  }
});

modelSubmissionSchema.pre('validate', function() {
  if (!this.results || this.results.length === 0) {
    throw new Error('Validation failed: You must provide at least one cluster size result.');
  }

  const seenClusterSizes = new Set();
  this.results.forEach((res) => {
    // Clear out any nulls or empty strings
    if (res.scoreARI === null || res.scoreARI === '') res.scoreARI = undefined;
    if (res.scoreNMI === null || res.scoreNMI === '') res.scoreNMI = undefined;
    if (res.scoreSilhouette === null || res.scoreSilhouette === '') res.scoreSilhouette = undefined;
    if (res.scoreAMI === null || res.scoreAMI === '') res.scoreAMI = undefined;
    if (res.scoreHomogeneity === null || res.scoreHomogeneity === '') res.scoreHomogeneity = undefined;
    if (res.scoreVMeasure === null || res.scoreVMeasure === '') res.scoreVMeasure = undefined;

    if (!res.clusterSize || isNaN(res.clusterSize) || res.clusterSize <= 0) {
      throw new Error('Validation failed: Cluster size must be a valid positive integer.');
    }
    if (seenClusterSizes.has(res.clusterSize)) {
      throw new Error(`Validation failed: Duplicate cluster size ${res.clusterSize} evaluation detected.`);
    }
    seenClusterSizes.add(res.clusterSize);

    let count = 0;
    if (typeof res.scoreARI === 'number' && !isNaN(res.scoreARI)) count++;
    if (typeof res.scoreNMI === 'number' && !isNaN(res.scoreNMI)) count++;
    if (typeof res.scoreSilhouette === 'number' && !isNaN(res.scoreSilhouette)) count++;

    if (count < 2) {
      throw new Error(`Validation failed for cluster size ${res.clusterSize}: You must provide at least two of the primary metrics (ARI, NMI, Silhouette).`);
    }
  });
});

const ModelSubmission = mongoose.models.ModelSubmission || mongoose.model('ModelSubmission', modelSubmissionSchema);
export default ModelSubmission;
