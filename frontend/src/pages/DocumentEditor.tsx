import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DocumentEditor from '../components/DocumentEditor'
import { apiClient } from '../lib/api'
import type { Document } from '../types/editor'
import { PageContainer, EditorWrapper } from '../components/styled/EditorComponents'

export default function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  // Removed isSaving state as content updates are now handled by WebSocket
  const [currentUser, setCurrentUser] = useState<{ 
    id: string; 
    email: string; 
    firstName?: string;
    lastName?: string;
    fullName?: string;
  } | null>(null)

  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }

    fetchDocument()
    fetchCurrentUser()
  }, [id, navigate])

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await apiClient.getCurrentUser()
      
      if (response.error) {
        console.error('Failed to fetch current user:', response.error)
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
    }
  }

  const fetchDocument = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await apiClient.getDocument(id!)

      if (response.error) {
        if (response.error.includes('401') || response.error.includes('Unauthorized')) {
          navigate('/login')
          return
        }
        throw new Error(response.error)
      }

      if (response.data) {
        setDocument(response.data as any)
        setTitle(response.data.title)
      }
    } catch (err) {
      console.error('Failed to fetch document:', err)
      setMessage('Failed to load document. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleContentChange = async (content: any) => {
    // Content changes are now handled entirely through WebSocket → Kafka → Worker
    // No direct API calls needed as the editor pushes operations via WebSocket
    console.log('Content changed - handled by WebSocket real-time collaboration')
  }

  const handleTitleSave = async () => {
    // Title updates are now handled entirely through WebSocket → Kafka → Worker
    // For now, we'll just update local state and let WebSocket operations handle persistence
    if (!document || !title.trim()) return
    
    setDocument({ ...document, title: title.trim() })
    console.log('Title updated locally - consider adding WebSocket title update event')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (message) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-orange-600 mb-4">{message}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Document not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <PageContainer>
      <EditorWrapper>
        {currentUser && (
          <DocumentEditor
            documentId={document.id}
            userId={currentUser.id}
            initialContent={document.content}
            onContentChange={handleContentChange}
            title={title}
            onTitleChange={setTitle}
            onTitleSave={handleTitleSave}
          />
        )}
      </EditorWrapper>
    </PageContainer>
  )
}