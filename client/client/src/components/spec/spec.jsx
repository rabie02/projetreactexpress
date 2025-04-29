import React, { useEffect, useState } from 'react';
import { getProductSpecifications } from './servicenow';
import './spec.css';
import defaultProductImage from '../../assets/default-product.png';
import Chatbot from './Chatbot';

const ProductSpecifications = () => {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchTerm, setAiSearchTerm] = useState('');
  const [aiResults, setAiResults] = useState([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // Configuration API
  const API_CONFIG = {
    endpoints: {
      specifications: getProductSpecifications,
      aiSearch: "https://dev268291.service-now.com/api/sn_prd_pm/ai_search_proxy2/search"
    },
    headers: {
      "Authorization": "Basic " + btoa("admin:K5F/Uj/lDbo9"),
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProductSpecifications();
        setSpecs(data || []);
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
        setError("Une erreur s'est produite");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredSpecs = specs.filter(spec =>
    spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spec.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredSpecs.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredSpecs.length / productsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleAiSearch = async () => {
    if (!aiSearchTerm.trim()) return;
    
    setIsAiSearching(true);
    try {
      const response = await fetch(
        `${API_CONFIG.endpoints.aiSearch}?term=${encodeURIComponent(aiSearchTerm)}`,
        { headers: API_CONFIG.headers }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAiResults(data.result?.result?.items || data.result?.items || data.result || []);
    } catch (err) {
      console.error("AI Search error:", err);
      setAiResults([]);
      setError("Erreur lors de la recherche AI");
    } finally {
      setIsAiSearching(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Chargement des spécifications...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <p className="error-message">Erreur: {error}</p>
    </div>
  );

  return (
    <div className="h-full">
      {/* Header Cyan */}
      <div className="h-36 bg-cyan-700/40 flex items-end py-3 px-20">
        <div className="flex w-full justify-between">
          
          {/* Champ recherche placé CORRECTEMENT dans le header */}
          <div className="relative w-80 transition-all focus-within:w-96">
            <input
              type="text"
              placeholder="Rechercher des spécifications..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 pl-10 pr-4 text-gray-700 bg-white border outline-none transition-all border-gray-300 rounded-md shadow"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
  
        </div>
      </div>
  
      {/* Main Content */}
      <div className="product-specs-container">
  
        <div className="specs-content">
          <h1 className="text-2xl font-bold mb-6">Product Specifications</h1>
  
          {/* Products Grid */}
          <main className="specs-container">
            {currentProducts.length === 0 ? (
              <div className="no-results text-center py-10">
                <p className="text-gray-500">Aucune spécification trouvée</p>
              </div>
            ) : (
              <>
                <div className="specs-grid">
                  {currentProducts.map((spec) => (
                    <div key={spec.sys_id} className="spec-card">
                      <div className="spec-image-container">
                        <img
                          src={spec.image_url || defaultProductImage}
                          alt={spec.display_name}
                          className="spec-image"
                          onError={(e) => { e.target.src = defaultProductImage }}
                        />
                      </div>
                      <div className="spec-details">
                        <h3 className="spec-name">{spec.display_name}</h3>
                        <p className="spec-id">Réf: {spec.name}</p>
                        <div className="spec-attributes">
                          {spec.attributes && Object.entries(spec.attributes).map(([key, value]) => (
                            <div key={key} className="attribute">
                              <span className="attribute-key">{key}:</span>
                              <span className="attribute-value">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button className="view-details-button">
                        Voir détails
                      </button>
                    </div>
                  ))}
                </div>
  
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
                    >
                      Précédent
                    </button>
  
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`pagination-button ${currentPage === number ? 'active' : ''}`}
                      >
                        {number}
                      </button>
                    ))}
  
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
  
        </div>
      </div>
    </div>
  );
  
  
};

export default ProductSpecifications;