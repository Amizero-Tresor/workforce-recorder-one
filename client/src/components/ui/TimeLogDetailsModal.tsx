'use client';

import { Modal } from './Modal';
import { formatDate, formatTime, formatDuration } from '@/lib/utils';
import { Clock, User, FolderOpen, MessageSquare, Calendar } from 'lucide-react';

interface TimeLogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeLog: any;
}

export function TimeLogDetailsModal({ isOpen, onClose, timeLog }: TimeLogDetailsModalProps) {
  if (!timeLog) return null;

  const calculateDuration = () => {
    if (!timeLog.startTime || !timeLog.endTime) return 0;
    const start = new Date(timeLog.startTime);
    const end = new Date(timeLog.endTime);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Time Log Details"
      size="lg"
    >
      <div className="space-y-4 lg:space-y-6">
        {/* Worker Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-[#008080] to-[#006666] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">
                {timeLog.user?.firstName} {timeLog.user?.lastName}
              </h3>
              <p className="text-sm text-gray-600">{timeLog.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FolderOpen className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
              <h4 className="font-medium text-blue-900 text-sm lg:text-base">Project</h4>
            </div>
            <p className="text-blue-800 text-sm lg:text-base">{timeLog.project?.name}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
              <h4 className="font-medium text-green-900 text-sm lg:text-base">Date</h4>
            </div>
            <p className="text-green-800 text-sm lg:text-base">{formatDate(timeLog.startTime)}</p>
          </div>
        </div>

        {/* Time Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-purple-900 mb-1 text-sm lg:text-base">Check In</h4>
            <p className="text-base lg:text-lg font-bold text-purple-800">
              {formatTime(timeLog.startTime)}
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600 mx-auto mb-2" />
            <h4 className="font-medium text-orange-900 mb-1 text-sm lg:text-base">Check Out</h4>
            <p className="text-base lg:text-lg font-bold text-orange-800">
              {timeLog.endTime ? formatTime(timeLog.endTime) : 'Ongoing'}
            </p>
          </div>

          <div className="bg-teal-50 rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-teal-600 mx-auto mb-2" />
            <h4 className="font-medium text-teal-900 mb-1 text-sm lg:text-base">Total Time</h4>
            <p className="text-base lg:text-lg font-bold text-teal-800">
              {formatDuration(timeLog.totalHours || calculateDuration())}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">Status</h4>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            timeLog.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
            timeLog.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            timeLog.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {timeLog.status === 'APPROVED' && '✅ Approved'}
            {timeLog.status === 'PENDING' && '⏳ Pending Review'}
            {timeLog.status === 'REJECTED' && '❌ Rejected'}
            {timeLog.status === 'EDIT_REQUESTED' && '📝 Edit Requested'}
          </span>
        </div>

        {/* Description */}
        {timeLog.description && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900 text-sm lg:text-base">Activity Description</h4>
            </div>
            <p className="text-gray-700 text-sm lg:text-base">{timeLog.description}</p>
          </div>
        )}

        {/* Feedback */}
        {timeLog.feedback && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2 text-sm lg:text-base">Admin Feedback</h4>
            <p className="text-yellow-800 text-sm lg:text-base">{timeLog.feedback}</p>
            {timeLog.reviewer && (
              <p className="text-sm text-yellow-600 mt-2">
                By: {timeLog.reviewer.firstName} {timeLog.reviewer.lastName}
              </p>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-gray-500 border-t pt-4 space-y-1">
          <p>Created: {new Date(timeLog.createdAt).toLocaleString()}</p>
          {timeLog.reviewedAt && (
            <p>Reviewed: {new Date(timeLog.reviewedAt).toLocaleString()}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}