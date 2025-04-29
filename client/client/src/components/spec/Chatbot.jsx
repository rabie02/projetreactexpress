import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      text: "Bonjour! Je suis votre assistant pour la gestion des spécifications produits. Comment puis-je vous aider aujourd'hui?", 
      sender: 'bot',
      options: [
        "Lister les spécifications",
        "Créer une nouvelle spécification",
        "Aide-moi à publier une spécification"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [specData, setSpecData] = useState({
    name: '',
    display_name: '',
    category: '',
    type: '',
    start_date: '',
    end_date: '',
    owner: '',
    description: '',
    status: 'draft',
    external_code: '',
    line: '',
    cost_to_company: '',
    composite: false,
    installation_required: false,
    location_specific: false
  });
  const messagesEndRef = useRef(null);

  // Configuration ServiceNow
    const SN_CONFIG = {
      baseURL: import.meta.env.VITE_SN_URL || 'https://dev323456.service-now.com',
      auth: {
        username: import.meta.env.VITE_SN_USER || 'admin',
        password: import.meta.env.VITE_SN_PASS || 'bz!T-1ThIc1L'
      },
    endpoints: {
      searchSpecs: '/api/now/table/sn_prd_pm_product_specification',
      createSpec: '/api/now/table/sn_prd_pm_product_specification',
      publishSpec: '/api/now/table/sn_prd_pm_product_specification/{sys_id}'
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      if (currentStep) {
        await processStepResponse(input);
      } else {
        const response = await processUserInput(input);
        setMessages(prev => [...prev, response]);
        if (response.data) {
          setMessages(prev => [...prev, { 
            text: formatSpecifications(response.data), 
            sender: 'bot',
            isData: true,
            options: getFollowUpOptions(response.intent)
          }]);
        }
      }
    } catch (error) {
      console.error("Erreur chatbot:", error);
      addBotMessage("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Traitement intelligent de l'entrée utilisateur
  const processUserInput = async (userInput) => {
    const intent = detectIntent(userInput);
    let response;
  
    switch(intent) {
      case 'search':
        const searchResults = await searchSpecifications();
        if (searchResults && searchResults.length > 0) {
          response = {
            text: "Voici les spécifications publiées disponibles:",
            sender: 'bot',
            data: searchResults,
            intent: 'search'
          };
        } else {
          response = {
            text: "Aucune spécification publiée n'a été trouvée.",
            sender: 'bot',
            intent: 'search'
          };
        }
        break;
        
      case 'create':
        startSpecCreation();
        return {
          text: "Commençons par créer une nouvelle spécification. Quel est le nom de la spécification?",
          sender: 'bot',
          intent: 'create'
        };
        
      case 'publish':
        const specId = context?.lastCreatedId || extractSpecId(userInput);
        if (!specId) {
          return {
            text: "Je n'ai pas pu identifier quelle spécification vous voulez publier. Pouvez-vous préciser l'ID?",
            sender: 'bot',
            intent: 'clarify_publish'
          };
        }
        
        const publishedSpec = await publishSpecification(specId);
        response = {
          text: `Spécification ${publishedSpec.name} publiée avec succès!`,
          sender: 'bot',
          data: [publishedSpec],
          intent: 'publish',
          options: [
            "Voir toutes les spécifications publiées",
            "Créer une nouvelle spécification"
          ]
        };
        break;
        
      case 'help':
      default:
        response = {
          text: "Je peux vous aider avec:",
          sender: 'bot',
          options: [
            "Lister les spécifications",
            "Créer une nouvelle spécification",
            "Publier une spécification",
            "Rechercher par norme"
          ]
        };
    }
    
    return response;
  };

  const startSpecCreation = () => {
    setCurrentStep('name');
    setSpecData({
      name: '',
      display_name: '',
      category: '',
      type: '',
      start_date: '',
      end_date: '',
      owner: '',
      description: '',
      status: 'draft',
      external_code: '',
      line: '',
      cost_to_company: '',
      composite: false,
      installation_required: false,
      location_specific: false
    });
  };

  const processStepResponse = async (input) => {
    switch(currentStep) {
      case 'name':
        setSpecData({...specData, name: input});
        setCurrentStep('display_name');
        addBotMessage(`Nom enregistré: ${input}. Quel est le nom d'affichage?`);
        break;
      
      case 'display_name':
        setSpecData({...specData, display_name: input});
        setCurrentStep('category');
        addBotMessage(`Nom d'affichage enregistré: ${input}. Quelle est la catégorie?`, [
          "connectivity",
          "Forfait",
          "hardware",
          "Internet",
          "Autre"
        ]);
        break;
      
      case 'category':
        setSpecData({...specData, category: input});
        setCurrentStep('type');
        addBotMessage(`Catégorie enregistrée: ${input}. Quel est le type?`);
        break;
      
      case 'type':
        setSpecData({...specData, type: input});
        setCurrentStep('start_date');
        addBotMessage(`Type enregistré: ${input}. Quelle est la date de début (format yyyy-MM-dd)?`);
        break;
      
      case 'start_date':
        if (!isValidDate(input)) {
          addBotMessage("Format de date invalide. Veuillez entrer la date au format yyyy-MM-dd.");
          return;
        }
        setSpecData({...specData, start_date: input});
        setCurrentStep('end_date');
        addBotMessage(`Date de début enregistrée: ${input}. Quelle est la date de fin (format yyyy-MM-dd)?`);
        break;
      
      case 'end_date':
        if (!isValidDate(input)) {
          addBotMessage("Format de date invalide. Veuillez entrer la date au format yyyy-MM-dd.");
          return;
        }
        setSpecData({...specData, end_date: input});
        setCurrentStep('owner');
        addBotMessage(`Date de fin enregistrée: ${input}. Qui est le propriétaire?`);
        break;
      
      case 'owner':
        setSpecData({...specData, owner: input});
        setCurrentStep('description');
        addBotMessage(`Propriétaire enregistré: ${input}. Veuillez fournir une description.`);
        break;
      
      case 'description':
        setSpecData({...specData, description: input});
        setCurrentStep('external_code');
        addBotMessage(`Description enregistrée. Quel est le code externe?`);
        break;
      
      case 'external_code':
        setSpecData({...specData, external_code: input});
        setCurrentStep('line');
        addBotMessage(`Code externe enregistré: ${input}. Quelle est la ligne de produit?`);
        break;
      
      case 'line':
        setSpecData({...specData, line: input});
        setCurrentStep('cost_to_company');
        addBotMessage(`Ligne de produit enregistrée: ${input}. Quel est le coût pour l'entreprise?`);
        break;
      
      case 'cost_to_company':
        setSpecData({...specData, cost_to_company: input});
        setCurrentStep('composite');
        addBotMessage(`Coût enregistré: ${input}. Est-ce une spécification composite?`, [
          "Oui",
          "Non"
        ]);
        break;
      
      case 'composite':
        const isComposite = input.toLowerCase() === 'oui';
        setSpecData({...specData, composite: isComposite});
        setCurrentStep('installation_required');
        addBotMessage(`Composite: ${isComposite ? 'Oui' : 'Non'}. Une installation est-elle requise?`, [
          "Oui",
          "Non"
        ]);
        break;
      
      case 'installation_required':
        const installationRequired = input.toLowerCase() === 'oui';
        setSpecData({...specData, installation_required: installationRequired});
        setCurrentStep('location_specific');
        addBotMessage(`Installation requise: ${installationRequired ? 'Oui' : 'Non'}. Est-ce spécifique à un lieu?`, [
          "Oui",
          "Non"
        ]);
        break;
      
      case 'location_specific':
        const locationSpecific = input.toLowerCase() === 'oui';
        setSpecData({...specData, location_specific: locationSpecific});
        confirmAndSaveSpec();
        break;
      
      default:
        addBotMessage("Je n'ai pas compris. Pouvez-vous répéter?");
    }
  };

  const isValidDate = (dateString) => {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if(!dateString.match(regEx)) return false;
    const d = new Date(dateString);
    return !isNaN(d.getTime());
  };

  const confirmAndSaveSpec = () => {
    const confirmationMessage = `Voici le récapitulatif de votre spécification:
      - Nom: ${specData.name}
      - Nom d'affichage: ${specData.display_name}
      - Catégorie: ${specData.category}
      - Type: ${specData.type}
      - Dates: ${specData.start_date} à ${specData.end_date}
      - Propriétaire: ${specData.owner}
      - Description: ${specData.description}
      
      Voulez-vous enregistrer cette spécification?`;
    
    addBotMessage(confirmationMessage, [
      "Oui, enregistrer",
      "Non, modifier"
    ]);
    
    setCurrentStep('confirmation');
  };

  const saveSpecification = async () => {
    try {
      const response = await axios.post(SN_CONFIG.endpoints.createSpec, specData, {
        baseURL: SN_CONFIG.baseURL,
        auth: SN_CONFIG.auth
      });

      const savedSpec = response.data.result;
      setContext({ lastCreatedId: savedSpec.sys_id });
      addBotMessage(`Spécification enregistrée avec succès! Numéro: ${savedSpec.number}`);
      
      // Reset for new specification
      setCurrentStep(null);
      
      addBotMessage("Que souhaitez-vous faire maintenant?", [
        "Voir cette spécification",
        "Créer une nouvelle spécification",
        "Retour au menu principal"
      ]);
      
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      addBotMessage("Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer.");
    }
  };

  // Détection d'intention améliorée
  const detectIntent = (text) => {
    text = text.toLowerCase();
    
    if (/(liste|afficher|voir|donner|chercher|recherche|trouver)/.test(text) && 
        /(spécification|spec|fiche|produit)/.test(text)) {
      return 'search';
    }
    
    if (/(créer|nouveau|nouvelle|ajouter|générer)/.test(text) && 
        /(spécification|spec|fiche)/.test(text)) {
      return 'create';
    }
    
    if (/(publier|valider|finaliser|activer)/.test(text) && 
        /(spécification|spec|fiche)/.test(text)) {
      return 'publish';
    }
    
    if (/(aide|assistance|help|soutien)/.test(text)) {
      return 'help';
    }
    
    return 'help';
  };

  // Fonctions ServiceNow
  const searchSpecifications = async (query = '') => {
    try {
      const params = {
        sysparm_limit: 10,
        sysparm_query: 'status=published'
      };
      
      if (query) {
        params.sysparm_query = `status=published^nameLIKE${query}^ORdescriptionLIKE${query}`;
      }
      
      const response = await axios.get(SN_CONFIG.endpoints.searchSpecs, {
        baseURL: SN_CONFIG.baseURL,
        auth: SN_CONFIG.auth,
        params
      });
      
      return response.data.result;
    } catch (error) {
      console.error("Erreur recherche specs:", error);
      throw new Error("Impossible de récupérer les spécifications.");
    }
  };

  const publishSpecification = async (specId) => {
    try {
      const response = await axios.patch(
        SN_CONFIG.endpoints.publishSpec.replace('{sys_id}', specId),
        { status: 'published' },
        { baseURL: SN_CONFIG.baseURL, auth: SN_CONFIG.auth }
      );

      return response.data.result;
    } catch (error) {
      console.error("Erreur publication:", error);
      throw new Error(`Erreur lors de la publication de la spécification ${specId}.`);
    }
  };

  // Fonctions d'extraction améliorées
  const extractSpecId = (text) => {
    const idRegex = /(SPEC|spec)[- ]?([A-Z0-9]{8,})/i;
    const match = text.match(idRegex);
    return match ? match[0] : null;
  };

  // Formatage des données
  const formatSpecifications = (specs) => {
    if (!specs || !Array.isArray(specs)) {
      return <div className="no-data">Aucune donnée disponible</div>;
    }

    return (
      <div className="specs-table">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>ID</th>
              <th>Catégorie</th>
              <th>Type</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {specs.map(spec => (
              <tr key={spec.sys_id}>
                <td>{spec.name}</td>
                <td className="monospace">{spec.sys_id}</td>
                <td>{spec.category || 'N/A'}</td>
                <td>{spec.type || 'N/A'}</td>
                <td className={`status-${spec.status}`}>
                  {spec.status === 'draft' ? 'Brouillon' : 'Publiée'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Fonctions utilitaires
  const addBotMessage = (text, options = []) => {
    setMessages(prev => [...prev, { text, sender: 'bot', options }]);
  };

  const getFollowUpOptions = (intent) => {
    switch(intent) {
      case 'search':
        return ["Filtrer les résultats", "Créer une nouvelle spécification"];
      case 'create':
        return ["Publier cette spécification", "Voir toutes les spécifications"];
      case 'publish':
        return ["Vérifier le statut", "Créer une nouvelle spécification"];
      default:
        return [];
    }
  };

  const handleQuickOption = (option) => {
    if (currentStep === 'confirmation') {
      if (option.includes("Oui")) {
        saveSpecification();
      } else {
        startSpecCreation();
        addBotMessage("Très bien, recommençons. Quel est le nom de la spécification?");
      }
      return;
    }
    
    setInput(option);
    setTimeout(() => {
      handleSendMessage();
    }, 300);
  };

  return (
    <div className={`chatbot-wrapper ${isOpen ? 'open' : ''}`}>
      <div className="chatbot-button" onClick={toggleChatbot}>
        <div className="chatbot-icon">
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        <span>Assistant</span>
      </div>

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h2>Assistant Spécifications</h2>
            <p>Comment puis-je vous aider?</p>
            <button className="close-button" onClick={toggleChatbot}>
              &times;
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <div className="message-content">
                  {msg.text}
                  {msg.data && formatSpecifications(msg.data)}
                  
                  {msg.options && (
                    <div className="quick-options">
                      {msg.options.map((option, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleQuickOption(option)}
                          className="quick-option"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message bot">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tapez votre message ici..."
              disabled={loading}
            />
            <button 
              onClick={handleSendMessage} 
              disabled={loading || !input.trim()}
              className="send-button"
            >
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <span>Envoyer</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;