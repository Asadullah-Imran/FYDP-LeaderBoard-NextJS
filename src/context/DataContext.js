'use client';
import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [sections, setSections] = useState([]);
  const [models, setModels] = useState([]);
  const [modelDetails, setModelDetails] = useState({}); // Cache for single models: { [id]: modelObj }
  const [globalLoading, setGlobalLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Fetch sections and models if not already loaded (or if forced)
  const fetchGlobalData = async (force = false) => {
    if (isDataLoaded && !force) {
      return { sections, models };
    }

    setGlobalLoading(true);
    try {
      const [sectionsRes, modelsRes] = await Promise.all([
        axios.get(`${API_URL}/sections`),
        axios.get(`${API_URL}/models`)
      ]);
      setSections(sectionsRes.data);
      setModels(modelsRes.data);
      setIsDataLoaded(true);
      return { sections: sectionsRes.data, models: modelsRes.data };
    } catch (error) {
      console.error('Error fetching global data:', error);
      throw error;
    } finally {
      setGlobalLoading(false);
    }
  };

  // Get single model details (uses cache first)
  const getModelDetail = async (id, force = false) => {
    if (modelDetails[id] && !force) {
      return modelDetails[id];
    }

    try {
      const { data } = await axios.get(`${API_URL}/models/${id}`);
      setModelDetails((prev) => ({ ...prev, [id]: data }));
      
      // Also update in the general models list if it exists there
      setModels((prev) => prev.map((m) => (m._id === id ? data : m)));
      
      return data;
    } catch (error) {
      console.error(`Error fetching model ${id}:`, error);
      throw error;
    }
  };

  // Update a model after edit
  const updateModelInCache = (updatedModel) => {
    const id = updatedModel._id;
    const oldModel = models.find(m => m._id === id);
    const oldName = oldModel ? oldModel.name : updatedModel.name;

    setModelDetails((prev) => {
      const copy = { ...prev };
      copy[id] = updatedModel;
      
      // Update metadata on all other model detail objects in cache with matching name
      Object.keys(copy).forEach((k) => {
        if (copy[k].name === oldName || copy[k].name === updatedModel.name) {
          copy[k] = {
            ...copy[k],
            name: updatedModel.name,
            descriptionMarkdown: updatedModel.descriptionMarkdown,
            methodologyImages: updatedModel.methodologyImages,
            architectureFlow: updatedModel.architectureFlow,
            githubUrl: updatedModel.githubUrl,
            paperUrl: updatedModel.paperUrl
          };
        }
      });
      return copy;
    });

    setModels((prev) => prev.map((m) => {
      if (m._id === id) return updatedModel;
      if (m.name === oldName || m.name === updatedModel.name) {
        return {
          ...m,
          name: updatedModel.name,
          descriptionMarkdown: updatedModel.descriptionMarkdown,
          methodologyImages: updatedModel.methodologyImages,
          architectureFlow: updatedModel.architectureFlow,
          githubUrl: updatedModel.githubUrl,
          paperUrl: updatedModel.paperUrl
        };
      }
      return m;
    }));
  };

  // Add a new model
  const addModelToCache = (newModel) => {
    setModels((prev) => [newModel, ...prev]);
    if (newModel._id) {
      setModelDetails((prev) => ({ ...prev, [newModel._id]: newModel }));
    }
  };

  // Delete a model
  const deleteModelFromCache = (modelId) => {
    setModels((prev) => prev.filter((m) => m._id !== modelId));
    setModelDetails((prev) => {
      const copy = { ...prev };
      delete copy[modelId];
      return copy;
    });
  };

  // Force fetch sections list (e.g. after adding a section)
  const fetchSections = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/sections`);
      setSections(data);
      return data;
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw error;
    }
  };

  const clearCache = () => {
    setSections([]);
    setModels([]);
    setModelDetails({});
    setIsDataLoaded(false);
  };

  return (
    <DataContext.Provider
      value={{
        sections,
        models,
        modelDetails,
        globalLoading,
        isDataLoaded,
        fetchGlobalData,
        getModelDetail,
        updateModelInCache,
        addModelToCache,
        deleteModelFromCache,
        fetchSections,
        clearCache
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === null) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
