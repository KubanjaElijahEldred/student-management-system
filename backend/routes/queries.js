// MongoDB Query Builder API Routes
const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const Student = require('../models/Student');

// Comparison Operators
router.post('/comparison', authRequired, async (req, res) => {
  try {
    const { field, operator, value } = req.body;
    
    let query = {};
    const numValue = !isNaN(value) ? Number(value) : value;
    
    switch(operator) {
      case '$eq':
        query[field] = numValue;
        break;
      case '$ne':
        query[field] = { $ne: numValue };
        break;
      case '$gt':
        query[field] = { $gt: numValue };
        break;
      case '$lt':
        query[field] = { $lt: numValue };
        break;
      case '$gte':
        query[field] = { $gte: numValue };
        break;
      case '$lte':
        query[field] = { $lte: numValue };
        break;
      default:
        return res.status(400).json({ success: false, error: 'Invalid operator' });
    }
    
    const results = await Student.find(query).limit(20);
    res.json({ 
      success: true, 
      query: query,
      count: results.length,
      results: results 
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Logical Operators
router.post('/logical', authRequired, async (req, res) => {
  try {
    const { operator } = req.body;
    
    let query = {};
    
    switch(operator) {
      case '$and':
        // Example: age > 20 AND gender = "Male"
        query = { 
          $and: [
            { age: { $gt: 20 } },
            { gender: "Male" }
          ]
        };
        break;
      case '$or':
        // Example: age < 22 OR gender = "Female"
        query = { 
          $or: [
            { age: { $lt: 22 } },
            { gender: "Female" }
          ]
        };
        break;
      case '$nor':
        // Example: NOT (age < 21 OR gender = "Male")
        query = { 
          $nor: [
            { age: { $lt: 21 } },
            { gender: "Male" }
          ]
        };
        break;
      default:
        return res.status(400).json({ success: false, error: 'Invalid operator' });
    }
    
    const results = await Student.find(query).limit(20);
    res.json({ 
      success: true, 
      query: query,
      count: results.length,
      results: results 
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Sort and Limit
router.post('/sort', authRequired, async (req, res) => {
  try {
    const { sortField, sortOrder, limit } = req.body;
    
    const sortObj = {};
    sortObj[sortField] = parseInt(sortOrder);
    
    const results = await Student.find()
      .sort(sortObj)
      .limit(parseInt(limit) || 10);
    
    res.json({ 
      success: true, 
      sortBy: sortObj,
      limit: limit,
      count: results.length,
      results: results 
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Search by name
router.get('/search', authRequired, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json({ success: true, results: [] });
    }
    
    const results = await Student.find({
      name: { $regex: q, $options: 'i' }
    }).limit(20);
    
    res.json({ 
      success: true, 
      query: q,
      count: results.length,
      results: results 
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Advanced filter
router.post('/filter', authRequired, async (req, res) => {
  try {
    const { minAge, maxAge, gender, courseId } = req.body;
    
    let query = {};
    
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = parseInt(minAge);
      if (maxAge) query.age.$lte = parseInt(maxAge);
    }
    
    if (gender) {
      query.gender = gender;
    }
    
    if (courseId) {
      query.course_ids = parseInt(courseId);
    }
    
    const results = await Student.find(query).limit(50);
    
    res.json({ 
      success: true, 
      filters: { minAge, maxAge, gender, courseId },
      count: results.length,
      results: results 
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
