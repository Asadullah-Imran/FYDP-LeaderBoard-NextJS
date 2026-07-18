const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually parse .env file to support zero-dependency running
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let val = parts.slice(1).join('=').trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  });
}

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI is not defined in your environment variables.');
  process.exit(1);
}

// Define inline schemas for migration script to avoid ES Module path resolution errors
const modelProfileSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  descriptionMarkdown: { type: String, required: true },
  architectureFlow: { type: String },
  methodologyImages: [{ type: String }],
  githubUrl: { type: String },
  paperUrl: { type: String }
}, { timestamps: true });

const ModelProfile = mongoose.models.ModelProfile || mongoose.model('ModelProfile', modelProfileSchema);

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
  modelProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ModelProfile' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  datasetSectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DatasetSection', required: true },
  results: { type: [clusterResultSchema], required: true },
  scoreARI: { type: Number },
  scoreNMI: { type: Number },
  scoreSilhouette: { type: Number },
  scoreAMI: { type: Number },
  scoreHomogeneity: { type: Number },
  scoreVMeasure: { type: Number },
  clusterSize: { type: Number },
  descriptionMarkdown: { type: String },
  methodologyImages: [{ type: String }],
  architectureFlow: { type: String },
  githubUrl: { type: String },
  colabUrl: { type: String },
  kaggleUrl: { type: String },
  paperUrl: { type: String },
}, { timestamps: true });

const ModelSubmission = mongoose.models.ModelSubmission || mongoose.model('ModelSubmission', modelSubmissionSchema);

async function migrate() {
  try {
    console.log('Initiating database connection to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connection established successfully.');

    const submissions = await ModelSubmission.find({});
    console.log(`Found ${submissions.length} model submissions in the database.`);

    // Group submissions by model name
    const grouped = {};
    submissions.forEach(sub => {
      const name = sub.name.trim();
      if (!grouped[name]) {
        grouped[name] = [];
      }
      grouped[name].push(sub);
    });

    console.log(`Unique models to process: ${Object.keys(grouped).length}`);

    for (const [modelName, subs] of Object.entries(grouped)) {
      console.log(`\nProcessing Model: "${modelName}" (${subs.length} submissions)`);

      // Find if profile already exists in DB
      let profile = await ModelProfile.findOne({ name: modelName });
      
      if (!profile) {
        console.log(`- Creating new ModelProfile for "${modelName}"...`);
        
        // Find a submission in the group that has the most complete metadata
        let bestSub = subs[0];
        let maxImageCount = (bestSub.methodologyImages || []).length;
        
        for (const sub of subs) {
          const imgCount = (sub.methodologyImages || []).length;
          const hasDesc = !!sub.descriptionMarkdown && sub.descriptionMarkdown.trim().length > 50;
          
          if (hasDesc && (imgCount > maxImageCount || (!bestSub.descriptionMarkdown || bestSub.descriptionMarkdown.trim().length < 50))) {
            bestSub = sub;
            maxImageCount = imgCount;
          }
        }

        profile = new ModelProfile({
          name: modelName,
          descriptionMarkdown: bestSub.descriptionMarkdown || 'No description provided.',
          architectureFlow: bestSub.architectureFlow || '',
          methodologyImages: bestSub.methodologyImages || [],
          githubUrl: bestSub.githubUrl || '',
          paperUrl: bestSub.paperUrl || ''
        });

        await profile.save();
        console.log(`✓ ModelProfile created successfully with ID: ${profile._id}`);
      } else {
        console.log(`- Existing ModelProfile found for "${modelName}" with ID: ${profile._id}`);
      }

      // Update submissions to reference this profile
      let updatedCount = 0;
      for (const sub of subs) {
        if (!sub.modelProfileId || sub.modelProfileId.toString() !== profile._id.toString()) {
          sub.modelProfileId = profile._id;
          await sub.save();
          updatedCount++;
        }
      }
      console.log(`✓ Linked ${updatedCount}/${subs.length} submissions to profile.`);
    }

    console.log('\n======================================================');
    console.log('Database schema decoupling migration completed successfully!');
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
