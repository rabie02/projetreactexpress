const express = require('express');
const ProductSpecification = require('../../models/ProductSpecification');
const router = express.Router();
const jwt = require('jsonwebtoken');

require('dotenv').config();

// PUBLIC - POST : Create or Update Product Specification
router.post('/product-specification', async (req, res) => {
  try {
    const specification = req.body;

    console.log('📥 [POST] Specification reçue :', specification);

    // 🔥 NE PAS enregistrer si status != 'Published'
    if (!specification.status || specification.status.toLowerCase() !== 'published') {
      console.log('❌ Status différent de Published. Specification ignorée.');
      return res.status(400).json({ error: 'Specification ignorée car status != Published' });
    }

    const existingSpec = await ProductSpecification.findOne({ sys_id: specification.sys_id });

    if (existingSpec) {
      Object.assign(existingSpec, specification);
      await existingSpec.save();
      console.log('✅ Specification mise à jour dans MongoDB');
    } else {
      const newSpec = new ProductSpecification(specification);
      await newSpec.save();
      console.log('✅ Nouvelle Specification enregistrée dans MongoDB');
    }

    res.status(200).json({ message: '✅ Specification enregistrée ou mise à jour' });

  } catch (err) {
    console.error('❌ Erreur Product Specification :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUBLIC - DELETE : Delete Product Specification
router.delete('/product-specification/:sys_id', async (req, res) => {
  try {
    const sysId = req.params.sys_id;
    console.log('📥 [DELETE] Suppression demandée pour :', sysId);

    const result = await ProductSpecification.deleteOne({ sys_id: sysId });

    if (result.deletedCount === 1) {
      console.log('✅ Specification supprimée');
      res.status(200).json({ message: `✅ Specification ${sysId} supprimée.` });
    } else {
      console.log('⚠️ Specification non trouvée');
      res.status(404).json({ error: `Specification ${sysId} introuvable.` });
    }

  } catch (err) {
    console.error('❌ Erreur suppression Specification :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PROTECTED - GET : Retrieve all Product Specifications
router.get('/product-specification', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) return res.status(401).json({ error: 'Invalid authorization format' });

    jwt.verify(token, process.env.JWT_SECRET);

    const specifications = await ProductSpecification.find();

    res.status(200).json(specifications);

  } catch (err) {
    console.error('❌ Erreur récupération spécifications :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
