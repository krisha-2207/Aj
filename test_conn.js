process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('./backend/node_modules/pg');

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'sa-east-1',
  'ca-central-1',
  'ap-northeast-1',
  'ap-northeast-2'
];

async function testRegions() {
  for (const region of regions) {
    const connectionString = `postgresql://postgres.xbzbgwfhuzrmnoighnaq:4rwbeNw4DY9P5c7K@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    try {
      await client.connect();
      const res = await client.query('SELECT current_database(), version();');
      console.log('>>> SUCCESS! Connected to region:', region);
      console.log('Valid DATABASE_URL:', `postgresql://postgres.xbzbgwfhuzrmnoighnaq:4rwbeNw4DY9P5c7K@aws-0-${region}.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`);
      await client.end();
      return region;
    } catch (e) {
      console.log(`Failed for ${region}: ${e.message}`);
      try { await client.end(); } catch (err) {}
    }
  }
}

testRegions();
