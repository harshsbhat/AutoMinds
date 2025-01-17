'use client';

import { getNodes } from '@/app/actions/getNodes';
import GoogleDriveTrigger from '@/components/forms/drive/trigger';
import GitHubAction from '@/components/forms/github/node';
import GitHubTrigger from '@/components/forms/github/trigger';
import GoogleDriveAction from '@/components/forms/drive/node';
import GmailTrigger from '@/components/forms/gmail/trigger';
import GmailActions from '@/components/forms/gmail/node';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Node as PrismaNode, GoogleNode, GithubNode } from '@prisma/client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';

type NodeWithRelations = PrismaNode & {
  googleNode?: GoogleNode | null;
  githubNode?: GithubNode | null;
};

function WorkFlowSegment() {
  const { toast } = useToast();
  const { workFlowSegment } = useParams<{ workFlowSegment: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStep = parseInt(searchParams.get('step') || '1', 10);
  const editorPath = `/workflows/editor/${workFlowSegment}`;
  const [nodes, setNodes] = useState<NodeWithRelations[] | null>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsFetching(true);
      const res = await getNodes({ workflowId: workFlowSegment });
      if (!res) {
        setIsFetching(false);
        toast({
          title: 'Error',
          description: 'Error fetching data',
          variant: 'destructive',
        });
        return;
      }
      setNodes(res);
      console.log(res);
      setIsFetching(false);
    }
    fetchData();
  }, [workFlowSegment, toast]);

  const renderStep = (step: number) => {
    if (!nodes) return null;
    const node = nodes[step - 1];
    if (!node) return null;

    switch (node.type) {
      case 'Google':
        if (node.googleNode?.ServiceName === 'GoogleDrive') {
          return node.workerType === 'Trigger' ? (
            <GoogleDriveTrigger
              steps={currentStep + 1}
              nodeId={nodes[currentStep - 1].id}
            isLast={currentStep === nodes.length}
            />
          ) : (
            <GoogleDriveAction
              steps={currentStep + 1}
              nodeId={nodes[currentStep - 1].id}
            isLast={currentStep === nodes.length}
            />
          );
        } else if (node.googleNode?.ServiceName === 'GoogleMail') {
          return node.workerType === 'Trigger' ? (
            <GmailTrigger
              steps={currentStep + 1}
              nodeId={nodes[currentStep - 1].id}
            isLast={currentStep === nodes.length}
            />
          ) : (
            <GmailActions
              steps={currentStep + 1}
              nodeId={nodes[currentStep - 1].id}
            isLast={currentStep === nodes.length}
            />
          );
        }
        return null;
      case 'Github':
        return node.workerType === 'Trigger' ? (
          <GitHubTrigger
            steps={currentStep + 1}
            nodeId={nodes[currentStep - 1].id}
            isLast={currentStep === nodes.length}
          />
        ) : (
          <GitHubAction
            steps={currentStep + 1}
            nodeId={nodes[currentStep - 1].id}
            isLast={currentStep === nodes.length}
          />
        );
      default:
        return null;
    }
  };

  const handleStepChange = (step: number) => {
    router.push(`/workflows/${workFlowSegment}?step=${step}`);
  };

  const handlePublish = () => {
    setIsPublishModalOpen(false);
    router.push('/workflows');
  };

  if (isFetching) return <div>Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="flex justify-between mb-6">
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={() => router.push('/workflows')}
            className="px-6 py-3 text-lg font-semibold"
          >
            Workflow page
          </Button>
        </motion.div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={() => router.push(editorPath)}
            className="px-6 py-3 text-lg font-semibold"
          >
            Editor
          </Button>
        </motion.div>
      </div>

      <div className="flex-grow mb-6">{renderStep(currentStep)}</div>

      <div className="flex flex-col items-center space-y-4">
        <div className="flex justify-center space-x-2 mb-4">
          {nodes &&
            nodes.map((_, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant={currentStep === index + 1 ? 'default' : 'outline'}
                  onClick={() => handleStepChange(index + 1)}
                  className="w-10 h-10 rounded-full"
                >
                  {index + 1}
                </Button>
              </motion.div>
            ))}
        </div>

        <div className="flex justify-between w-full max-w-md">
          <Button
            variant="outline"
            onClick={() => handleStepChange(currentStep - 1)}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          {currentStep === nodes?.length ? (
            <Dialog
              open={isPublishModalOpen}
              onOpenChange={setIsPublishModalOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Publish
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Publication</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to publish this workflow?
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsPublishModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handlePublish}>Confirm</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleStepChange(currentStep + 1)}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkFlowSegment;
