const { supabaseAdmin } = require('./supabase');

// Model to Supabase table mapping
const MODEL_TABLES = {
  user: 'User',
  pharmacy: 'Pharmacy',
  medicine: 'Medicine',
  medicineBatch: 'MedicineBatch',
  bill: 'Bill',
  billItem: 'BillItem',
  purchaseOrder: 'PurchaseOrder',
  purchaseOrderItem: 'PurchaseOrderItem',
  purchaseReturn: 'PurchaseReturn',
  salesReturn: 'SalesReturn',
  dealer: 'Dealer',
  staff: 'Staff',
  expense: 'Expense',
  customer: 'Customer'
};

// Relation definitions for PostgREST joins
const MODEL_RELATIONS = {
  User: {
    pharmacy: { target: 'Pharmacy', query: 'pharmacy:Pharmacy(*)', isList: false },
    staffProfile: { target: 'Staff', query: 'staffProfile:Staff(*)', isList: false },
    dealerProfile: { target: 'Dealer', query: 'dealerProfile:Dealer(*)', isList: false },
    bills: { target: 'Bill', query: 'bills:Bill(*)', isList: true }
  },
  Medicine: {
    batches: { target: 'MedicineBatch', query: 'batches:MedicineBatch(*)', isList: true }
  },
  MedicineBatch: {
    medicine: { target: 'Medicine', query: 'medicine:Medicine(*)', isList: false },
    dealer: { target: 'Dealer', query: 'dealer:Dealer(*)', isList: false },
    pharmacy: { target: 'Pharmacy', query: 'pharmacy:Pharmacy(*)', isList: false }
  },
  Bill: {
    customer: { target: 'Customer', query: 'customer:Customer(*)', isList: false },
    staff: { target: 'User', query: 'staff:User!staffId(*)', isList: false },
    items: { target: 'BillItem', query: 'items:BillItem(*)', isList: true }
  },
  BillItem: {
    bill: { target: 'Bill', query: 'bill:Bill(*)', isList: false },
    medicine: { target: 'Medicine', query: 'medicine:Medicine(*)', isList: false },
    batch: { target: 'MedicineBatch', query: 'batch:MedicineBatch(*)', isList: false }
  },
  PurchaseOrder: {
    dealer: { target: 'Dealer', query: 'dealer:Dealer(*)', isList: false },
    pharmacy: { target: 'Pharmacy', query: 'pharmacy:Pharmacy(*)', isList: false },
    items: { target: 'PurchaseOrderItem', query: 'items:PurchaseOrderItem(*)', isList: true }
  },
  PurchaseOrderItem: {
    medicine: { target: 'Medicine', query: 'medicine:Medicine(*)', isList: false },
    order: { target: 'PurchaseOrder', query: 'order:PurchaseOrder(*)', isList: false }
  },
  Dealer: {
    user: { target: 'User', query: 'user:User(*)', isList: false },
    batches: { target: 'MedicineBatch', query: 'batches:MedicineBatch(*)', isList: true },
    purchaseOrders: { target: 'PurchaseOrder', query: 'purchaseOrders:PurchaseOrder(*)', isList: true }
  },
  Staff: {
    user: { target: 'User', query: 'user:User(*)', isList: false }
  },
  PurchaseReturn: {
    dealer: { target: 'Dealer', query: 'dealer:Dealer(*)', isList: false },
    pharmacy: { target: 'Pharmacy', query: 'pharmacy:Pharmacy(*)', isList: false }
  },
  SalesReturn: {
    bill: { target: 'Bill', query: 'bill:Bill(*)', isList: false },
    pharmacy: { target: 'Pharmacy', query: 'pharmacy:Pharmacy(*)', isList: false }
  }
};

// Build PostgREST select query string
function buildSelectString(modelName, include, select) {
  if (select && typeof select === 'object') {
    const fields = [];
    for (const [key, val] of Object.entries(select)) {
      if (!val) continue;
      const rels = MODEL_RELATIONS[modelName] || {};
      if (rels[key]) {
        const rel = rels[key];
        const nestedSelect = typeof val === 'object' ? buildSelectString(rel.target, val.include, val.select) : '*';
        const alias = rel.query.substring(0, rel.query.indexOf('('));
        fields.push(`${alias}(${nestedSelect})`);
      } else {
        fields.push(key);
      }
    }
    return fields.length > 0 ? fields.join(', ') : '*';
  }

  const parts = ['*'];
  if (include && typeof include === 'object') {
    for (const [key, val] of Object.entries(include)) {
      if (!val) continue;
      const rels = MODEL_RELATIONS[modelName] || {};
      const rel = rels[key];
      if (rel) {
        if (typeof val === 'object' && (val.include || val.select)) {
          const nestedSelect = buildSelectString(rel.target, val.include, val.select);
          const alias = rel.query.substring(0, rel.query.indexOf('('));
          parts.push(`${alias}(${nestedSelect})`);
        } else {
          parts.push(rel.query);
        }
      }
    }
  }
  return parts.join(', ');
}

// Normalize relations that are expected to be 1-to-1 or N-to-1
function normalizeRecordRelations(record, modelName) {
  if (!record || typeof record !== 'object') return record;
  const rels = MODEL_RELATIONS[modelName] || {};
  for (const [relKey, relDef] of Object.entries(rels)) {
    if (record[relKey] !== undefined) {
      if (!relDef.isList && Array.isArray(record[relKey])) {
        record[relKey] = record[relKey].length > 0 ? record[relKey][0] : null;
      }
      if (record[relKey] && typeof record[relKey] === 'object') {
        if (Array.isArray(record[relKey])) {
          record[relKey].forEach((item) => normalizeRecordRelations(item, relDef.target));
        } else {
          normalizeRecordRelations(record[relKey], relDef.target);
        }
      }
    }
  }
  return record;
}

// Apply Prisma-style 'where' conditions to Supabase query builder
function applyWhereConditions(query, where) {
  if (!where || typeof where !== 'object') return query;

  // Flatten compound unique keys, e.g. { medicineId_batchNumber: { medicineId, batchNumber } }
  const cleanWhere = {};
  for (const [k, v] of Object.entries(where)) {
    if (k.includes('_') && v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      Object.assign(cleanWhere, v);
    } else {
      cleanWhere[k] = v;
    }
  }

  for (const [key, val] of Object.entries(cleanWhere)) {
    if (val === undefined) continue;

    if (key === 'OR' && Array.isArray(val)) {
      const orClauses = [];
      val.forEach((cond) => {
        for (const [ck, cv] of Object.entries(cond)) {
          if (cv && typeof cv === 'object' && !Array.isArray(cv) && !(cv instanceof Date)) {
            if (cv.contains !== undefined) {
              const op = cv.mode === 'insensitive' ? 'ilike' : 'like';
              orClauses.push(`${ck}.${op}.*${cv.contains}*`);
            } else if (cv.in !== undefined && Array.isArray(cv.in)) {
              orClauses.push(`${ck}.in.(${cv.in.join(',')})`);
            } else if (cv.equals !== undefined) {
              orClauses.push(`${ck}.eq.${cv.equals}`);
            }
          } else {
            orClauses.push(`${ck}.eq.${cv}`);
          }
        }
      });
      if (orClauses.length > 0) {
        query = query.or(orClauses.join(','));
      }
      continue;
    }

    if (val === null) {
      query = query.is(key, null);
      continue;
    }

    if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if (val.in !== undefined && Array.isArray(val.in)) {
        query = query.in(key, val.in);
      } else if (val.notIn !== undefined && Array.isArray(val.notIn)) {
        query = query.not(key, 'in', `(${val.notIn.join(',')})`);
      } else if (val.gte !== undefined) {
        const v = val.gte instanceof Date ? val.gte.toISOString() : val.gte;
        query = query.gte(key, v);
      } else if (val.lte !== undefined) {
        const v = val.lte instanceof Date ? val.lte.toISOString() : val.lte;
        query = query.lte(key, v);
      } else if (val.gt !== undefined) {
        const v = val.gt instanceof Date ? val.gt.toISOString() : val.gt;
        query = query.gt(key, v);
      } else if (val.lt !== undefined) {
        const v = val.lt instanceof Date ? val.lt.toISOString() : val.lt;
        query = query.lt(key, v);
      } else if (val.contains !== undefined) {
        if (val.mode === 'insensitive') {
          query = query.ilike(key, `%${val.contains}%`);
        } else {
          query = query.like(key, `%${val.contains}%`);
        }
      } else if (val.startsWith !== undefined) {
        query = query.like(key, `${val.startsWith}%`);
      } else if (val.equals !== undefined) {
        query = query.eq(key, val.equals);
      } else if (val.not !== undefined) {
        query = query.neq(key, val.not);
      }
    } else {
      const v = val instanceof Date ? val.toISOString() : val;
      query = query.eq(key, v);
    }
  }

  return query;
}

// Create a Model delegate
function createModelDelegate(modelName, tableName) {
  return {
    async findMany(args = {}) {
      const selectStr = buildSelectString(tableName, args.include, args.select);
      let query = supabaseAdmin.from(tableName).select(selectStr);

      query = applyWhereConditions(query, args.where);

      if (args.orderBy) {
        const orders = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
        for (const order of orders) {
          for (const [col, dir] of Object.entries(order)) {
            query = query.order(col, { ascending: String(dir).toLowerCase() === 'asc' });
          }
        }
      }

      if (args.skip !== undefined && args.take !== undefined) {
        const start = parseInt(args.skip, 10);
        const end = start + parseInt(args.take, 10) - 1;
        query = query.range(start, end);
      } else if (args.take !== undefined) {
        query = query.limit(parseInt(args.take, 10));
      }

      const { data, error } = await query;
      if (error) {
        console.error(`[Supabase ${tableName}.findMany Error]:`, error);
        throw new Error(error.message);
      }

      return (data || []).map((row) => normalizeRecordRelations(row, tableName));
    },

    async findFirst(args = {}) {
      const selectStr = buildSelectString(tableName, args.include, args.select);
      let query = supabaseAdmin.from(tableName).select(selectStr);

      query = applyWhereConditions(query, args.where);

      if (args.orderBy) {
        const orders = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
        for (const order of orders) {
          for (const [col, dir] of Object.entries(order)) {
            query = query.order(col, { ascending: String(dir).toLowerCase() === 'asc' });
          }
        }
      }

      query = query.limit(1);
      const { data, error } = await query;
      if (error) {
        console.error(`[Supabase ${tableName}.findFirst Error]:`, error);
        throw new Error(error.message);
      }

      if (!data || data.length === 0) return null;
      return normalizeRecordRelations(data[0], tableName);
    },

    async findUnique(args = {}) {
      return this.findFirst(args);
    },

    async create(args = {}) {
      let insertData = { ...args.data };

      // Handle Date objects
      for (const [k, v] of Object.entries(insertData)) {
        if (v instanceof Date) {
          insertData[k] = v.toISOString();
        }
      }

      const { data, error } = await supabaseAdmin.from(tableName).insert([insertData]).select().single();
      if (error) {
        console.error(`[Supabase ${tableName}.create Error]:`, error);
        throw new Error(error.message);
      }

      return normalizeRecordRelations(data, tableName);
    },

    async update(args = {}) {
      let updateData = { ...args.data };

      // Check if there are { increment: n } or { decrement: n } operations
      const hasAtomicOps = Object.values(updateData).some(
        (v) => v && typeof v === 'object' && (v.increment !== undefined || v.decrement !== undefined)
      );

      if (hasAtomicOps) {
        // Fetch current values
        const current = await this.findFirst({ where: args.where });
        if (current) {
          for (const [k, v] of Object.entries(updateData)) {
            if (v && typeof v === 'object') {
              if (v.increment !== undefined) {
                updateData[k] = (current[k] || 0) + v.increment;
              } else if (v.decrement !== undefined) {
                updateData[k] = (current[k] || 0) - v.decrement;
              }
            }
          }
        }
      }

      for (const [k, v] of Object.entries(updateData)) {
        if (v instanceof Date) {
          updateData[k] = v.toISOString();
        }
      }

      let query = supabaseAdmin.from(tableName).update(updateData);
      query = applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();

      if (error) {
        console.error(`[Supabase ${tableName}.update Error]:`, error);
        throw new Error(error.message);
      }

      return normalizeRecordRelations(data, tableName);
    },

    async delete(args = {}) {
      let query = supabaseAdmin.from(tableName).delete();
      query = applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();

      if (error) {
        console.error(`[Supabase ${tableName}.delete Error]:`, error);
        throw new Error(error.message);
      }

      return normalizeRecordRelations(data, tableName);
    },

    async deleteMany(args = {}) {
      let query = supabaseAdmin.from(tableName).delete();
      query = applyWhereConditions(query, args.where || {});
      const { error, count } = await query;

      if (error) {
        console.error(`[Supabase ${tableName}.deleteMany Error]:`, error);
        throw new Error(error.message);
      }

      return { count: count || 0 };
    },

    async count(args = {}) {
      let query = supabaseAdmin.from(tableName).select('*', { count: 'exact', head: true });
      query = applyWhereConditions(query, args.where);
      const { count, error } = await query;

      if (error) {
        console.error(`[Supabase ${tableName}.count Error]:`, error);
        throw new Error(error.message);
      }

      return count || 0;
    },

    // Special groupBy implementation (used by dashboard top-sellers)
    async groupBy(args = {}) {
      const { by = [], _sum = {}, orderBy = {}, take } = args;
      const { data, error } = await supabaseAdmin.from(tableName).select('*');
      if (error) throw new Error(error.message);

      const groups = {};
      (data || []).forEach((row) => {
        const key = by.map((b) => row[b]).join('__');
        if (!groups[key]) {
          groups[key] = {
            ...by.reduce((acc, b) => ({ ...acc, [b]: row[b] }), {}),
            _sum: {}
          };
          for (const sField of Object.keys(_sum)) {
            groups[key]._sum[sField] = 0;
          }
        }
        for (const sField of Object.keys(_sum)) {
          groups[key]._sum[sField] += Number(row[sField] || 0);
        }
      });

      let result = Object.values(groups);

      if (orderBy._sum) {
        for (const [col, dir] of Object.entries(orderBy._sum)) {
          const isDesc = String(dir).toLowerCase() === 'desc';
          result.sort((a, b) => (isDesc ? b._sum[col] - a._sum[col] : a._sum[col] - b._sum[col]));
        }
      }

      if (take) {
        result = result.slice(0, take);
      }

      return result;
    }
  };
}

// Build Client Database instance
const db = {
  async $transaction(callback) {
    return await callback(db);
  },
  $use() {},
  async $connect() {},
  async $disconnect() {}
};

for (const [modelKey, tableName] of Object.entries(MODEL_TABLES)) {
  db[modelKey] = createModelDelegate(modelKey, tableName);
}

module.exports = db;
