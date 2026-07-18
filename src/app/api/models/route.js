import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ModelSubmission from '@/models/ModelSubmission';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const models = await ModelSubmission.find({})
      .populate('authorId', 'name')
      .populate('datasetSectionId', 'name');
    return NextResponse.json(models);
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
      githubUrl 
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

    const model = new ModelSubmission({
      name,
      authorId: currentUser._id,
      datasetSectionId,
      results: modelResults,
      descriptionMarkdown,
      methodologyImages,
      architectureFlow,
      githubUrl
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
