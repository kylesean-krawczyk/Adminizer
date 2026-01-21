import React, { useState } from 'react'
import { X, Mail, Send, Paperclip, User, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface EmailDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  documents: any[]
  categoryColor: string
}

const EmailDocumentModal: React.FC<EmailDocumentModalProps> = ({
  isOpen,
  onClose,
  documents,
  categoryColor
}) => {
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: '',
    includeLinks: true,
    includeAttachments: false
  })
  const [sending, setSending] = useState(false)

  React.useEffect(() => {
    if (documents.length > 0) {
      const defaultSubject = documents.length === 1 
        ? `Document: ${documents[0].name}`
        : `${documents.length} Documents from ${documents[0].category}`
      
      setEmailData(prev => ({
        ...prev,
        subject: defaultSubject,
        message: generateDefaultMessage()
      }))
    }
  }, [documents])

  const generateDefaultMessage = () => {
    if (documents.length === 0) return ''
    
    if (documents.length === 1) {
      const doc = documents[0]
      return `Hi,

I'm sharing the following document with you:

Document: ${doc.name}
Category: ${doc.category}
${doc.description ? `Description: ${doc.description}` : ''}
Upload Date: ${format(new Date(doc.created_at), 'MMMM dd, yyyy')}
${doc.expiry_date ? `Expires: ${format(new Date(doc.expiry_date), 'MMMM dd, yyyy')}` : ''}

${emailData.includeLinks ? 'You can view this document using the link provided above.' : 'The document is attached to this email.'}

Best regards`
    } else {
      return `Hi,

I'm sharing ${documents.length} documents with you from our ${documents[0].category} collection:

${documents.map(doc => `• ${doc.name}`).join('\n')}

${emailData.includeLinks ? 'You can view these documents using the links provided above.' : 'The documents are attached to this email.'}

Best regards`
    }
  }

  const handleSend = async () => {
    if (!emailData.to.trim()) {
      alert('Please enter at least one recipient email address.')
      return
    }

    setSending(true)
    
    try {
      // Simulate email sending - in a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here you would integrate with your email service
      // For example: SendGrid, AWS SES, or a custom email API
      
      alert(`Email sent successfully to ${emailData.to}!`)
      onClose()
      
      // Reset form
      setEmailData({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        message: '',
        includeLinks: true,
        includeAttachments: false
      })
    } catch (error) {
      alert('Failed to send email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-${categoryColor}-100`}>
                <Mail className={`h-5 w-5 text-${categoryColor}-600`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Email Documents</h2>
                <p className="text-sm text-gray-600">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Email Form */}
            <div className="flex-1 p-6 overflow-y-auto">
              <form className="space-y-4">
                {/* Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    To *
                  </label>
                  <input
                    type="email"
                    value={emailData.to}
                    onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="recipient@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={sending}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple email addresses with commas
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CC
                    </label>
                    <input
                      type="email"
                      value={emailData.cc}
                      onChange={(e) => setEmailData(prev => ({ ...prev, cc: e.target.value }))}
                      placeholder="cc@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BCC
                    </label>
                    <input
                      type="email"
                      value={emailData.bcc}
                      onChange={(e) => setEmailData(prev => ({ ...prev, bcc: e.target.value }))}
                      placeholder="bcc@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending}
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={sending}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={emailData.message}
                    onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your message here..."
                    disabled={sending}
                  />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeLinks"
                      checked={emailData.includeLinks}
                      onChange={(e) => setEmailData(prev => ({ ...prev, includeLinks: e.target.checked }))}
                      className={`rounded text-${categoryColor}-600 focus:ring-${categoryColor}-500`}
                      disabled={sending}
                    />
                    <label htmlFor="includeLinks" className="text-sm text-gray-700">
                      Include download links in email
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeAttachments"
                      checked={emailData.includeAttachments}
                      onChange={(e) => setEmailData(prev => ({ ...prev, includeAttachments: e.target.checked }))}
                      className={`rounded text-${categoryColor}-600 focus:ring-${categoryColor}-500`}
                      disabled={sending}
                    />
                    <label htmlFor="includeAttachments" className="text-sm text-gray-700">
                      Attach files to email
                    </label>
                  </div>
                  
                  {emailData.includeAttachments && totalSize > 25 * 1024 * 1024 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Total file size ({formatFileSize(totalSize)}) exceeds typical email limits (25MB). 
                        Consider using download links instead.
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Document List Sidebar */}
            <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
              <div className="flex items-center space-x-2 mb-4">
                <Paperclip className="h-4 w-4 text-gray-600" />
                <h3 className="font-medium text-gray-900">Documents to Email</h3>
              </div>
              
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full bg-${categoryColor}-100 text-${categoryColor}-800`}>
                            {doc.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(doc.size)}
                          </span>
                        </div>
                        {doc.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>Total: {documents.length} document{documents.length !== 1 ? 's' : ''}</p>
                  <p>Size: {formatFileSize(totalSize)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !emailData.to.trim() || !emailData.subject.trim()}
              className={`flex items-center space-x-2 px-4 py-2 bg-${categoryColor}-600 text-white rounded-lg hover:bg-${categoryColor}-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
            >
              <Send className="h-4 w-4" />
              <span>{sending ? 'Sending...' : 'Send Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailDocumentModal