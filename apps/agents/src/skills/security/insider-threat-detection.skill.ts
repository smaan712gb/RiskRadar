import { registerSkill, type Skill, type SkillTool } from '../skill-registry.js';

/**
 * Insider Threat Detection Skill
 *
 * Expert-level insider threat analysis modeled on:
 * - CERT Insider Threat Center (Carnegie Mellon) research
 * - MITRE ATT&CK for Insider Threats
 * - NIST SP 800-53 AC/AU controls
 * - FBI counterintelligence behavioral indicators
 * - SANS SEC504 methodology
 */

const systemPrompt = `You are an expert insider threat analyst with combined knowledge from CERT/CC Carnegie Mellon insider threat research, MITRE ATT&CK insider threat framework, FBI behavioral analysis, and 20+ years of enterprise security operations.

CORE EXPERTISE:
- User and Entity Behavior Analytics (UEBA)
- Kill chain analysis for insider threats (recruitment → reconnaissance → circumvention → aggregation → exfiltration)
- Behavioral baseline deviation detection
- Data Loss Prevention (DLP) pattern analysis
- Access privilege abuse detection
- Temporal and geospatial anomaly detection
- Social engineering indicator recognition

INSIDER THREAT KILL CHAIN STAGES:

1. RECRUITMENT/MOTIVATION:
   - Performance issues or disciplinary actions
   - Denied promotion or compensation disputes
   - Personal financial stress indicators
   - Ideological radicalization signals
   - External solicitation indicators

2. RECONNAISSANCE:
   - Browsing organizational charts and access policies
   - Querying data catalogs for sensitive repositories
   - Testing access to systems outside normal job function
   - Mapping network shares and backup systems
   - Researching data exfiltration methods

3. CIRCUMVENTION:
   - Disabling security tools or endpoint agents
   - Using personal devices to bypass DLP
   - Accessing data through alternate paths (APIs vs. UI)
   - Using encryption or steganography
   - Proxy/VPN usage to mask activities
   - Requesting unnecessary access elevation

4. AGGREGATION:
   - Downloading large volumes of files over short periods
   - Copying data to personal storage (USB, cloud drives)
   - Consolidating data from multiple repositories
   - Creating archives or compressed files of sensitive data
   - Querying databases with broader scope than business need

5. EXFILTRATION:
   - Email attachments to personal accounts
   - Cloud storage uploads (personal Dropbox, Google Drive)
   - USB device data transfers
   - Screenshot captures of sensitive screens
   - Printing unusual volume of sensitive documents
   - Network transfers to unauthorized external hosts

BEHAVIORAL INDICATORS (WEIGHTED):
- After-hours system access (weight: 0.15)
- Access to data outside job function (weight: 0.20)
- Large data downloads or transfers (weight: 0.25)
- Disabling security controls (weight: 0.30)
- Communication anomalies (weight: 0.10)
- Resignation or termination notice (weight: 0.20)
- Denied access attempts (weight: 0.15)
- Peer interaction decline (weight: 0.10)
- USB/removable media usage (weight: 0.20)
- VPN from unusual locations (weight: 0.15)

ANALYTICAL METHODS:
- Peer group analysis: Compare user behavior to role-matched peers
- Temporal fingerprinting: Build per-user activity time profiles
- Access graph analysis: Map user-to-data relationships and detect scope creep
- Velocity detection: Rate-of-change in data access patterns
- Kill chain staging: Classify observed behaviors into threat stages
- Risk accumulation: Weighted scoring of concurrent indicators

When analyzing data, always:
1. Classify findings by insider threat kill chain stage
2. Apply MITRE ATT&CK for Insider Threats technique IDs
3. Calculate risk using weighted behavioral indicators
4. Consider base rates to estimate false positive probability
5. Recommend proportional response (monitor, restrict, investigate, escalate)
6. Flag any indicators that suggest imminent data exfiltration`;

const access_anomaly_tool: SkillTool = {
  name: 'access_anomaly_detection',
  description: 'Detect anomalous access patterns by comparing user behavior to peer group baselines',
  parameters: {
    userAccess: { type: 'object', description: '{userId, accessEvents: [{resource, timestamp, action, outcome}]}', required: true },
    peerBaseline: { type: 'object', description: '{avgAccessPerDay, stddevAccess, commonResources, activeHoursStart, activeHoursEnd}', required: true },
  },
  execute: async (params) => {
    const userAccess = params['userAccess'] as {
      userId: string;
      accessEvents: Array<{ resource: string; timestamp: string; action: string; outcome: string }>;
    };
    const baseline = params['peerBaseline'] as {
      avgAccessPerDay: number;
      stddevAccess: number;
      commonResources: string[];
      activeHoursStart: number;
      activeHoursEnd: number;
    };

    const events = userAccess.accessEvents;
    const uniqueResources = new Set(events.map((e) => e.resource));
    const uncommonResources = [...uniqueResources].filter(
      (r) => !baseline.commonResources.includes(r),
    );
    const afterHours = events.filter((e) => {
      const hour = new Date(e.timestamp).getHours();
      return hour < baseline.activeHoursStart || hour > baseline.activeHoursEnd;
    });
    const denied = events.filter((e) => e.outcome === 'denied');

    const dailyAccessRate = events.length; // simplified: assume 1 day of data
    const zScore = baseline.stddevAccess > 0
      ? (dailyAccessRate - baseline.avgAccessPerDay) / baseline.stddevAccess
      : 0;

    const riskFactors: string[] = [];
    let riskScore = 0;

    if (zScore > 2) { riskScore += 25; riskFactors.push(`Access volume ${zScore.toFixed(1)}σ above peer mean`); }
    if (uncommonResources.length > 0) { riskScore += 20; riskFactors.push(`${uncommonResources.length} resources outside normal job function`); }
    if (afterHours.length > 0) { riskScore += 15; riskFactors.push(`${afterHours.length} after-hours access events`); }
    if (denied.length > 2) { riskScore += 15; riskFactors.push(`${denied.length} denied access attempts`); }

    const killChainStage = uncommonResources.length > 3 ? 'reconnaissance'
      : denied.length > 5 ? 'circumvention'
      : zScore > 3 ? 'aggregation'
      : 'normal';

    return {
      userId: userAccess.userId,
      totalEvents: events.length,
      uniqueResources: uniqueResources.size,
      uncommonResources,
      afterHoursEvents: afterHours.length,
      deniedAttempts: denied.length,
      zScore: zScore.toFixed(2),
      killChainStage,
      riskScore: Math.min(riskScore, 100),
      riskLevel: riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW',
      riskFactors,
      mitreAttackTechniques: killChainStage !== 'normal' ? [
        ...(uncommonResources.length > 0 ? ['T1083 - File and Directory Discovery'] : []),
        ...(afterHours.length > 0 ? ['T1078 - Valid Accounts (off-hours)'] : []),
        ...(denied.length > 0 ? ['T1134 - Access Token Manipulation'] : []),
      ] : [],
    };
  },
};

const exfiltration_detection_tool: SkillTool = {
  name: 'exfiltration_pattern_detection',
  description: 'Detect data exfiltration patterns from file access, transfer, and communication logs',
  parameters: {
    activities: { type: 'array', description: 'Array of {userId, type, size_mb, destination, timestamp}', required: true },
    thresholds: { type: 'object', description: '{dailyTransferLimitMb, maxSingleFileMb, allowedDestinations}', required: false },
  },
  execute: async (params) => {
    const activities = params['activities'] as Array<{
      userId: string;
      type: string;
      size_mb: number;
      destination: string;
      timestamp: string;
    }>;
    const thresholds = (params['thresholds'] as {
      dailyTransferLimitMb: number;
      maxSingleFileMb: number;
      allowedDestinations: string[];
    }) ?? { dailyTransferLimitMb: 500, maxSingleFileMb: 100, allowedDestinations: [] };

    const totalSizeMb = activities.reduce((sum, a) => sum + a.size_mb, 0);
    const largeTransfers = activities.filter((a) => a.size_mb > thresholds.maxSingleFileMb);
    const externalTransfers = thresholds.allowedDestinations.length > 0
      ? activities.filter((a) => !thresholds.allowedDestinations.includes(a.destination))
      : [];

    const byType = new Map<string, number>();
    for (const a of activities) {
      byType.set(a.type, (byType.get(a.type) ?? 0) + a.size_mb);
    }

    const indicators: string[] = [];
    let riskScore = 0;

    if (totalSizeMb > thresholds.dailyTransferLimitMb) {
      riskScore += 30;
      indicators.push(`Total transfer ${totalSizeMb.toFixed(0)}MB exceeds ${thresholds.dailyTransferLimitMb}MB daily limit`);
    }
    if (largeTransfers.length > 0) {
      riskScore += 25;
      indicators.push(`${largeTransfers.length} transfers exceed ${thresholds.maxSingleFileMb}MB single-file limit`);
    }
    if (externalTransfers.length > 0) {
      riskScore += 30;
      indicators.push(`${externalTransfers.length} transfers to unauthorized destinations`);
    }

    // Check for archive/compressed file patterns (common exfil prep)
    const archiveTransfers = activities.filter((a) =>
      /\.(zip|rar|7z|tar|gz|encrypted)$/i.test(a.destination),
    );
    if (archiveTransfers.length > 0) {
      riskScore += 15;
      indicators.push(`${archiveTransfers.length} compressed/encrypted file transfers detected`);
    }

    return {
      totalActivities: activities.length,
      totalSizeMb: totalSizeMb.toFixed(1),
      largeTransfers: largeTransfers.length,
      externalTransfers: externalTransfers.length,
      archiveTransfers: archiveTransfers.length,
      transfersByType: Object.fromEntries(byType),
      riskScore: Math.min(riskScore, 100),
      riskLevel: riskScore >= 60 ? 'CRITICAL' : riskScore >= 40 ? 'HIGH' : riskScore >= 20 ? 'MEDIUM' : 'LOW',
      indicators,
      killChainStage: riskScore >= 60 ? 'exfiltration' : riskScore >= 30 ? 'aggregation' : 'normal',
      recommendedActions: riskScore >= 60
        ? ['Immediately restrict user network access', 'Preserve forensic evidence', 'Notify CISO and Legal', 'Initiate incident response']
        : riskScore >= 30
        ? ['Enable enhanced monitoring', 'Review access permissions', 'Schedule manager check-in']
        : ['Continue standard monitoring'],
    };
  },
};

const skill: Skill = {
  id: 'security.insider_threat_detection',
  name: 'Insider Threat Detection',
  version: '1.0.0',
  domain: 'security',
  tier: 'domain_expert',
  description: 'CERT/CC-level insider threat analysis: kill chain staging, UEBA, exfiltration detection, MITRE ATT&CK mapping',
  systemPrompt,
  tools: [access_anomaly_tool, exfiltration_detection_tool],
};

registerSkill(skill);
export default skill;
