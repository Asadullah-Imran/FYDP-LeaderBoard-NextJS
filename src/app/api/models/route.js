import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ModelSubmission from '@/models/ModelSubmission';
import { verifyAuth } from '@/lib/auth';
import ModelProfile from '@/models/ModelProfile';

export async function GET() {
  try {
    await connectDB();
    const models = await ModelSubmission.find({})
      .populate('modelProfileId')
      .populate('authorId', 'name')
      .populate('datasetSectionId', 'name');
      
    const processedModels = models.map(m => {
      const obj = m.toObject();
      if (obj.modelProfileId) {
        obj.descriptionMarkdown = obj.modelProfileId.descriptionMarkdown || obj.descriptionMarkdown;
        obj.architectureFlow = obj.modelProfileId.architectureFlow || obj.architectureFlow;
        obj.methodologyImages = obj.modelProfileId.methodologyImages || obj.methodologyImages;
        obj.githubUrl = obj.modelProfileId.githubUrl || obj.githubUrl;
        obj.paperUrl = obj.modelProfileId.paperUrl || obj.paperUrl;
      }
      return obj;
    });

    return NextResponse.json(processedModels);
  } catch (error) {
    console.error('Fetch models error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authorized, no token' }, { status: 401 });
    }

    const { 
      name, 
      datasetSectionId, 
      results,
      descriptionMarkdown, 
      methodologyImages, 
      architectureFlow, 
      githubUrl,
      colabUrl,
      kaggleUrl,
      paperUrl
    } = await req.json();

    const modelResults = Array.isArray(results) ? results.map(res => ({
      clusterSize: res.clusterSize !== undefined && res.clusterSize !== '' ? parseInt(res.clusterSize) : undefined,
      scoreARI: res.scoreARI !== undefined && res.scoreARI !== '' ? parseFloat(res.scoreARI) : undefined,
      scoreNMI: res.scoreNMI !== undefined && res.scoreNMI !== '' ? parseFloat(res.scoreNMI) : undefined,
      scoreSilhouette: res.scoreSilhouette !== undefined && res.scoreSilhouette !== '' ? parseFloat(res.scoreSilhouette) : undefined,
      scoreAMI: res.scoreAMI !== undefined && res.scoreAMI !== '' ? parseFloat(res.scoreAMI) : undefined,
      scoreHomogeneity: res.scoreHomogeneity !== undefined && res.scoreHomogeneity !== '' ? parseFloat(res.scoreHomogeneity) : undefined,
      scoreVMeasure: res.scoreVMeasure !== undefined && res.scoreVMeasure !== '' ? parseFloat(res.scoreVMeasure) : undefined,
      visible: res.visible !== undefined ? !!res.visible : true,
    })) : [];

    let profile = await ModelProfile.findOne({ name: name.trim() });
    if (!profile) {
      profile = new ModelProfile({
        name: name.trim(),
        descriptionMarkdown: descriptionMarkdown || 'No description provided.',
        architectureFlow: architectureFlow || '',
        methodologyImages: methodologyImages || [],
        githubUrl: githubUrl || '',
        paperUrl: paperUrl || ''
      });
      await profile.save();
    }

    const model = new ModelSubmission({
      name: name.trim(),
      modelProfileId: profile._id,
      authorId: currentUser._id,
      datasetSectionId,
      results: modelResults,
      descriptionMarkdown: profile.descriptionMarkdown,
      methodologyImages: profile.methodologyImages,
      architectureFlow: profile.architectureFlow,
      githubUrl: profile.githubUrl,
      colabUrl,
      kaggleUrl,
      paperUrl: profile.paperUrl
    });

    const createdModel = await model.save();
    return NextResponse.json(createdModel, { status: 201 });
  } catch (error) {
    console.error('Create model error:', error);
    if (error.name === 'ValidationError' || error.message.includes('Validation failed')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
