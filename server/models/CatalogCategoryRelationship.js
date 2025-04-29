const mongoose = require('mongoose');

const CatalogCategoryRelationshipSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    required: true,
    trim: true
  },
  sys_updated_by: {
    type: String,
    trim: true
  },
  sys_created_on: {
    type: String,
    trim: true
  },
  sys_mod_count: {
    type: String,
    trim: true
  },
  external_id: {
    type: String,
    default: "",
    trim: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  sys_updated_on: {
    type: String,
    trim: true
  },
  sys_tags: {
    type: String,
    default: "",
    trim: true
  },
  sys_created_by: {
    type: String,
    trim: true
  },
  external_source: {
    type: String,
    default: "",
    trim: true
  },
  target: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = mongoose.model('CatalogCategoryRelationship', CatalogCategoryRelationshipSchema);