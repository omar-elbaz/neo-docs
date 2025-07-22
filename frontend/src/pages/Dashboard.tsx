import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Fab,
  Avatar,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material'
import {
  Add as AddIcon,
  Description as DocumentIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material'
import { apiClient, type DocumentResponse } from '../lib/api'

type ViewMode = 'grid' | 'list'

export default function Dashboard() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<DocumentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [currentUser, setCurrentUser] = useState<{ 
    id: string; 
    email: string; 
    firstName?: string;
    lastName?: string;
    fullName?: string;
  } | null>(null)

  useEffect(() => {
    fetchDocuments()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await apiClient.getCurrentUser()
      
      if (response.error) {
        console.error('Failed to fetch current user:', response.error)
        navigate('/login')
        return
      }

      if (response.data) {
        setCurrentUser({ 
          id: response.data.userID, 
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          fullName: response.data.fullName
        })
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err)
      navigate('/login')
    }
  }

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await apiClient.getDocuments()
      
      if (response.error) {
        if (response.error.includes('401') || response.error.includes('Unauthorized')) {
          navigate('/login')
          return
        }
        throw new Error(response.error)
      }

      if (response.data) {
        setDocuments(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err)
      setMessage('Failed to load documents. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const createDocument = async () => {
    if (!newDocTitle.trim()) return

    setCreating(true)
    try {
      const response = await apiClient.createDocument({
        title: newDocTitle.trim(),
        content: ''
      })

      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        setDocuments(prev => [response.data, ...prev])
        setShowCreateModal(false)
        setNewDocTitle('')
        
        // Navigate to the new document
        navigate(`/documents/${response.data.id}`)
      }
    } catch (err) {
      console.error('Failed to create document:', err)
      setMessage('Failed to create document. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
              {currentUser && (
                <p className="text-gray-600 mt-1">Welcome back, {currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}` || currentUser.email}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Grid view"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List view"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <button
                onClick={() => navigate('/user')}
                className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                title={currentUser?.fullName || currentUser?.email || 'User Profile'}
              >
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Create New Document Card */}
            <div
              onClick={() => setShowCreateModal(true)}
              className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-8 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Document</h3>
                <p className="text-sm text-gray-500">Start writing your next document</p>
              </div>
            </div>

            {/* Document Cards */}
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  
                  {doc.shares.length > 0 && (
                    <div className="flex -space-x-1">
                      {doc.shares.slice(0, 2).map((share) => (
                        <div
                          key={share.user.id}
                          className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                          title={share.user.email}
                        >
                          {share.user.email[0].toUpperCase()}
                        </div>
                      ))}
                      {doc.shares.length > 2 && (
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                          +{doc.shares.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">
                  {doc.title}
                </h3>
                
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Updated {formatDate(doc.updatedAt)}</p>
                  <p>By {doc.author.email === currentUser?.email ? 'You' : doc.author.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <div className="flex-1 text-sm font-medium text-gray-900">Name</div>
                <div className="w-32 text-sm font-medium text-gray-900">Owner</div>
                <div className="w-40 text-sm font-medium text-gray-900">Last Modified</div>
                <div className="w-24 text-sm font-medium text-gray-900">Shared</div>
              </div>
            </div>
            
            {/* Create New Row */}
            <div 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center"
            >
              <div className="flex items-center flex-1">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-blue-600 font-medium">Create New Document</span>
              </div>
              <div className="w-32"></div>
              <div className="w-40"></div>
              <div className="w-24"></div>
            </div>

            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}`)}
                className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center"
              >
                <div className="flex items-center flex-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-900 font-medium truncate">{doc.title}</span>
                </div>
                <div className="w-32 text-sm text-gray-500 truncate">
                  {doc.author.email === currentUser?.email ? 'You' : doc.author.email}
                </div>
                <div className="w-40 text-sm text-gray-500">
                  {formatDate(doc.updatedAt)}
                </div>
                <div className="w-24">
                  {doc.shares.length > 0 && (
                    <div className="flex -space-x-1">
                      {doc.shares.slice(0, 3).map((share) => (
                        <div
                          key={share.user.id}
                          className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border border-white"
                          title={share.user.email}
                        >
                          {share.user.email[0].toUpperCase()}
                        </div>
                      ))}
                      {doc.shares.length > 3 && (
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border border-white">
                          +{doc.shares.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Get started by creating your first document. You can write, collaborate, and share with others in real-time.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create Your First Document
            </button>
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Document</h2>
            
            <input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Document title"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && createDocument()}
              autoFocus
            />
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewDocTitle('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createDocument}
                disabled={!newDocTitle.trim() || creating}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating && (
                  <div className="w-4 h-4 animate-spin rounded-full border border-white border-t-transparent"></div>
                )}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}