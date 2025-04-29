// servicenow.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://dev268291.service-now.com/',
  auth: {
    username: 'group2',
    password: 'Omt20252025*'
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const getProductSpecifications = async () => {
  try {
    // ⬇️ Ajouter un filtre sur le champ status
    const response = await instance.get('/api/now/table/sn_prd_pm_product_specification', {
      params: {
        sysparm_query: 'status=published'
      }
    });
    return response.data.result;
  } catch (error) {
    console.error('Erreur API:', error);
    return [];
  }
};
