const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-schemas
const taxIncludedAmountSchema = new Schema({
  unit: String,
  value: Number
});

const priceSchema = new Schema({
  taxIncludedAmount: taxIncludedAmountSchema
});

const validForSchema = new Schema({
  startDateTime: String,
  endDateTime: { type: String, default: null }
});

const productSpecCharValueValidForSchema = new Schema({
  startDateTime: { type: String, default: null }
});

const productSpecCharacteristicValueSchema = new Schema({
  value: String,
  validFor: productSpecCharValueValidForSchema
});

const prodSpecCharValueUseSchema = new Schema({
  name: String,
  description: String,
  valueType: String,
  validFor: validForSchema,
  productSpecCharacteristicValue: [productSpecCharacteristicValueSchema],
  productSpecification: { 
    type: Schema.Types.ObjectId,
    ref: 'ProductSpecification'
  }
});

// Main Product Offering Schema
const productOfferingSchema = new Schema({
  _id: { type: String, required: true }, // Using string ID from JSON
  href: String,
  name: { type: String, required: true },
  displayName: String,
  description: String,
  lifecycleStatus: { type: String, enum: ['Published', 'Draft', 'Archived', 'Retired'] },
  lastUpdate: Date,
  version: String,
  internalVersion: String,
  internalId: { type: String, unique: true },
  validFor: validForSchema,
  productOfferingTerm: String,
  productOfferingPrice: [{
    priceType: { 
      type: String, 
      enum: ['recurring', 'nonRecurring'],
      required: true
    },
    price: priceSchema
  }],
  productSpecification: {
    type: Schema.Types.ObjectId,
    ref: 'ProductSpecification',
    required: true
  },
  prodSpecCharValueUse: [prodSpecCharValueUseSchema],
  channel: String,
  category: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  status: { type: String, enum: ['Published', 'Draft', 'Archived', 'Retired'] }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add population virtuals
productOfferingSchema.virtual('populatedProductSpec', {
  ref: 'ProductSpecification',
  localField: 'productSpecification',
  foreignField: '_id',
  justOne: true
});

productOfferingSchema.virtual('populatedCategories', {
  ref: 'Category',
  localField: 'category',
  foreignField: '_id',
});

module.exports = mongoose.model('ProductOffering', productOfferingSchema);