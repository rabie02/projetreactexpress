const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSpecificationSchema = new Schema({
  sys_id: { type: String, required: true, unique: true },
  display_name: String,
  specification_category: String,
  specification_type: String,
  start_date: String,
  description: String,
  status: String,
  cost_to_company: String
}, { timestamps: true });

module.exports = mongoose.model('ProductSpecification', ProductSpecificationSchema, 'product_specifications');
