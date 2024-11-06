const express = require('express');
const cors = require('cors');
const axios = require('axios');
const logger = require('./logger/logger');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to get verified MFA factors for a user and log failures
async function getVerifiedMFAFactors(userId) {
  try {
    const { data, error } = await supabase.auth.admin.mfa.listFactors({ userId });
    if (error) throw error;

    const verifiedFactors = data.factors?.filter((factor) => factor.status === 'verified') || [];
    if (verifiedFactors.length === 0) {
      logger.warn(`MFA check failed for user ${userId}. Enable MFA for user to resolve failed check`);
    }

    return verifiedFactors.map((factor) => ({
      id: factor.id,
      type: factor.factor_type,
      createdAt: factor.created_at,
      updatedAt: factor.updated_at,
      lastChallengedAt: factor.last_challenged_at
    }));
  } catch (error) {
    logger.error(`Failed to fetch MFA factors for user ${userId}: ${error.message}`);
    throw new Error('Failed to retrieve MFA factors');
  }
}

// Helper function to get RLS status for all tables and log failures
async function getRLSStatus() {
  try {
    const { data, error } = await supabase.rpc('get_rls_status');
    if (error) throw error;

    data.forEach(table => {
      if (!table.rls_enabled) {
        logger.warn(`RLS check failed for table ${table.table_name} Enable RLS for ${table.table_name} to resolve failed check`);
      }
    });

    return data;
  } catch (error) {
    logger.error(`Error fetching RLS status: ${error.message}.`);
    throw new Error('Failed to retrieve RLS status');
  }
}

// Route to get users with their verified MFA info
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      logger.error(`Error fetching users: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }

    const users = data.users || [];
    const usersWithMFAInfo = await Promise.all(
      users.map(async (user) => {
        try {
          const verifiedFactors = await getVerifiedMFAFactors(user.id);
          return {
            id: user.id,
            email: user.email,
            mfaEnabled: verifiedFactors.length > 0,
            factors: verifiedFactors,
          };
        } catch (error) {
          logger.error(`Failed to fetch MFA info for user ${user.id}: ${error.message}`);
          return {
            id: user.id,
            email: user.email,
            mfaEnabled: false,
            factors: [],
            error: 'Failed to fetch MFA info',
          };
        }
      })
    );

    res.status(200).json({ users: usersWithMFAInfo });
  } catch (error) {
    logger.error(`Unexpected error in /api/users: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve users with MFA information' });
  }
});

app.get('/api/rls-status', async (req, res) => {
  try {
    const rlsStatus = await getRLSStatus();
    res.status(200).json({ tables: rlsStatus });
  } catch (error) {
    logger.error(`Unexpected error in /api/rls-status: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve RLS status' });
  }
});

// Helper function to get the PITR status for all projects and log failures
async function getPITRStatusForAllProjects() {
  try {
    const response = await axios.get("https://api.supabase.com/v1/projects", {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_MANAGEMENT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const projects = response.data;
    const projectStatuses = await Promise.all(
      projects.map(async (project) => {
        try {
          const projectResponse = await axios.get(`https://api.supabase.com/v1/projects/${project.id}/database/backups`, {
            headers: {
              Authorization: `Bearer ${process.env.SUPABASE_MANAGEMENT_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });

          const pitrEnabled = projectResponse.data.pitr_enabled || false;
          if (!pitrEnabled) {
            logger.warn(`PITR check failed for project ${project.name}. Enabled PITR for ${project.name} to resolve failed check.`);
          }

          return {
            projectName: project.name,
            projectId: project.id,
            pitrEnabled,
          };
        } catch (error) {
          logger.error(`Failed to retrieve PITR status for project ${project.name}: ${error.message}`);
          return {
            projectName: project.name,
            projectId: project.id,
            pitrEnabled: null,
            error: "Failed to retrieve PITR status"
          };
        }
      })
    );

    return projectStatuses;
  } catch (error) {
    logger.error(`Error fetching projects: ${error.message}`);
    throw new Error('Failed to retrieve projects and PITR status');
  }
}

// Route to get the PITR status for all projects
app.get('/api/pitr-status-all', async (req, res) => {
  try {
    const pitrStatuses = await getPITRStatusForAllProjects();
    res.status(200).json({ projects: pitrStatuses });
  } catch (error) {
    logger.error(`Unexpected error in /api/pitr-status-all: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve PITR status for all projects' });
  }
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});