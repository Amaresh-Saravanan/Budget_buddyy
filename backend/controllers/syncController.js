import { syncBankEmails } from '../services/emailSync.js'

// @desc    Manually trigger a bank-email sync
// @route   POST /api/sync/gmail
// @access  Private
export const triggerGmailSync = async (req, res) => {
  try {
    const result = await syncBankEmails()
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sync failed',
      error: error.message
    })
  }
}

export default { triggerGmailSync }
