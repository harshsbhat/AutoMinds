"use client"

import React, { useState, useCallback, DragEvent, useMemo, useEffect } from 'react'
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  addEdge,
  Connection,
  useReactFlow,
  Node,
  Edge
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useParams } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"
import { getNodesAndEdges } from '@/app/actions/getNodeAndEdges'
import { saveWorkflow } from '@/app/actions/saveWorkflow'
import CustomWorkflowNode from './_components/CustoWorkflowNodes'
import Sidebar from "./_components/Sidebar"

const nodeTypes = {
  customNode: CustomWorkflowNode,
}

export default function EditorContent() {
  const { toast } = useToast()
  const reactFlowInstance = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [searchTerm, setSearchTerm] = useState('')
  const { editorId } = useParams<{editorId : string}>()
  const [isSaving, setIsSaving] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    const fetchWorkflowData = async () => {
      setIsFetching(true)
      try {
        const data = await getNodesAndEdges({ workflowId: editorId })
        if (typeof data === "string") {
          toast({
            title: "Error",
            description: data,
            variant: "destructive",
          })
        } else {
          setNodes(data.nodes.map((node:any) => ({
            id: node.id,
            type: 'customNode',
            position: { x: node.positionX, y: node.positionY },
            data: {
              label: node.name,
              type: node.workerType,
              description: node.description,
              nodeType: node.type,
            },
          })))
          setEdges(data.edges.map((edge:any) => ({
            id: edge.id,
            source: edge.sourceId,
            target: edge.targetId,
          })))
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load workflow data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
      }
    }

    fetchWorkflowData()
  }, [editorId, toast, setNodes, setEdges])

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')

      if (typeof type === 'undefined' || !type) {
        return
      }

      const position = reactFlowInstance.project({
        x: event.clientX - 250,
        y: event.clientY,
      })

      if (nodes.length === 0 && type !== 'Google' && type !== 'Github') {
        toast({
          title: "Error",
          description: "The first node must be a trigger node.",
          variant: "destructive",
        })
        return
      }

      const newNode = {
        id: `${type}-${Date.now()}`,
        type: 'customNode',
        position,
        data: { 
          label: `${type} ${nodes.length === 0 ? 'Trigger' : 'Action'}`,
          type: nodes.length === 0 ? 'Trigger' : 'Action',
          description: `This is a ${nodes.length === 0 ? 'trigger' : 'action'} node for ${type}.`,
          nodeType: type === 'Google' ? 'Google' : 'Github',
        },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes, nodes, toast]
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const workflowData = {
        workflowId: editorId,
        nodes: nodes.map(node => ({
          id: node.id,
          name: node.data.label,
          description: node.data.description,
          type: node.data.nodeType,
          workerType: node.data.type,
          positionX: node.position.x,
          positionY: node.position.y,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          sourceId: edge.source,
          targetId: edge.target,
        })),
      }

      const response = await saveWorkflow({workflowId : workflowData.workflowId , nodes : workflowData.nodes, edges : workflowData.edges})
      if(response === "Workflow saved successfully"){
        toast({
          title: "Success",
          description: "Workflow saved successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: response,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col">
      <div className="flex-grow flex">
        <div className="flex-grow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls className="top-2 left-2" />
            <MiniMap className="bottom-2 left-2 w-0" pannable zoomable zoomStep={2} />
          </ReactFlow>
        </div>
        <Sidebar 
          handleSave={handleSave} 
          hasTrigger={nodes.length!==0}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isSaving={isSaving}
          isFetching={isFetching}
        />
      </div>
    </div>
  )
}