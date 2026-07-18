import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ModelSubmission from '@/models/ModelSubmission';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid reference ID format' }, { status: 400 });
    }

    const model = await ModelSubmission.findById(id)
      .populate('authorId', 'name')
      .populate('datasetSectionId', 'name');

    if (model) {
      return NextResponse.json(model);
    } else {
      return NextResponse.json({ message: 'Model not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Fetch model details error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);

    if (!currentUser) {
      return NextResponse.json({ message: 'Not authorized, no token' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid reference ID format' }, { status: 400 });
    }

    const model = await ModelSubmission.findById(id);
    if (!model) {
      return NextResponse.json({ message: 'Model not found' }, { status: 404 });
    }

    // Check authorization: author or admin only
    if (model.authorId.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
      return NextResponse.json({ message: 'Not authorized to update this model' }, { status: 401 });
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

    model.name = name || model.name;
    model.datasetSectionId = datasetSectionId || model.datasetSectionId;
    
    if (results !== undefined) {
      model.results = Array.isArray(results) ? results.map(res => ({
        clusterSize: res.clusterSize !== undefined && res.clusterSize !== '' ? parseInt(res.clusterSize) : undefined,
        scoreARI: res.scoreARI !== undefined && res.scoreARI !== '' ? parseFloat(res.scoreARI) : undefined,
        scoreNMI: res.scoreNMI !== undefined && res.scoreNMI !== '' ? parseFloat(res.scoreNMI) : undefined,
        scoreSilhouette: res.scoreSilhouette !== undefined && res.scoreSilhouette !== '' ? parseFloat(res.scoreSilhouette) : undefined,
        scoreAMI: res.scoreAMI !== undefined && res.scoreAMI !== '' ? parseFloat(res.scoreAMI) : undefined,
        scoreHomogeneity: res.scoreHomogeneity !== undefined && res.scoreHomogeneity !== '' ? parseFloat(res.scoreHomogeneity) : undefined,
        scoreVMeasure: res.scoreVMeasure !== undefined && res.scoreVMeasure !== '' ? parseFloat(res.scoreVMeasure) : undefined,
        visible: res.visible !== undefined ? !!res.visible : true,
      })) : [];
    }

    model.descriptionMarkdown = descriptionMarkdown !== undefined ? descriptionMarkdown : model.descriptionMarkdown;
    model.methodologyImages = methodologyImages || model.methodologyImages;
    model.architectureFlow = architectureFlow !== undefined ? architectureFlow : model.architectureFlow;
    model.githubUrl = githubUrl !== undefined ? githubUrl : model.githubUrl;

    const updatedModel = await model.save();
    
    const populatedModel = await ModelSubmission.findById(updatedModel._id)
      .populate('authorId', 'name')
      .populate('datasetSectionId', 'name');

    return NextResponse.json(populatedModel);
  } catch (error) {
    console.error('Update model error:', error);
    if (error.name === 'ValidationError' || error.message.includes('Validation failed')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);

    if (!currentUser) {
      return NextResponse.json({ message: 'Not authorized, no token' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid reference ID format' }, { status: 400 });
    }

    const model = await ModelSubmission.findById(id);
    if (!model) {
      return NextResponse.json({ message: 'Model not found' }, { status: 404 });
    }

    // Check authorization: author or admin only
    if (model.authorId.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
      return NextResponse.json({ message: 'Not authorized to delete this model' }, { status: 401 });
    }

    await ModelSubmission.deleteOne({ _id: model._id });
    return NextResponse.json({ message: 'Model removed' });
  } catch (error) {
    console.error('Delete model error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
