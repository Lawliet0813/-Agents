'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { trpc } from '~/lib/trpc/client'

interface VoiceRecorderProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'

export function VoiceRecorder({ open, onClose, onSuccess }: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const { data: courses } = trpc.courses.list.useQuery()
  const createNoteMutation = trpc.notes.create.useMutation()
  const utils = trpc.useUtils()

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Setup audio context for visualization
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Setup media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())

        // Stop visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }

      mediaRecorder.start()
      setRecordingState('recording')

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Start visualization
      visualize()
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('無法存取麥克風，請確認瀏覽器權限設定')
    }
  }

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause()
      setRecordingState('paused')
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume()
      setRecordingState('recording')
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState !== 'idle' && recordingState !== 'stopped') {
      mediaRecorderRef.current.stop()
      setRecordingState('stopped')
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  // Visualize audio waveform
  const visualize = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    const analyser = analyserRef.current

    if (!canvasCtx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (recordingState !== 'recording') return

      animationFrameRef.current = requestAnimationFrame(draw)

      analyser.getByteTimeDomainData(dataArray)

      canvasCtx.fillStyle = 'rgb(243, 244, 246)'
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = 'rgb(59, 130, 246)'

      canvasCtx.beginPath()

      const sliceWidth = (canvas.width * 1.0) / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2

        if (i === 0) {
          canvasCtx.moveTo(x, y)
        } else {
          canvasCtx.lineTo(x, y)
        }

        x += sliceWidth
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2)
      canvasCtx.stroke()
    }

    draw()
  }

  // Save recording
  const saveRecording = async () => {
    if (!audioBlob) return

    try {
      // Convert blob to base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      reader.onloadend = async () => {
        const base64Audio = reader.result as string

        // Create voice note
        await createNoteMutation.mutateAsync({
          courseId: selectedCourseId || undefined,
          originalFilePath: base64Audio,
          recordedAt: new Date(),
        })

        // Invalidate notes list
        await utils.notes.list.invalidate()

        // Reset and close
        handleClose()
        onSuccess?.()
      }
    } catch (error) {
      console.error('Error saving recording:', error)
      alert('儲存錄音時發生錯誤')
    }
  }

  // Handle close
  const handleClose = () => {
    // Clean up
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    // Reset state
    setRecordingState('idle')
    setRecordingTime(0)
    setAudioBlob(null)
    setAudioUrl('')
    setSelectedCourseId('')
    audioChunksRef.current = []

    onClose()
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [audioUrl])

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>錄製語音筆記</DialogTitle>
          <DialogDescription>
            錄製課程筆記，稍後可使用 AI 自動轉錄和摘要
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course">關聯課程（選填）</Label>
            <select
              id="course"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={recordingState === 'recording' || recordingState === 'paused'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">未分類</option>
              {courses?.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Visualization Canvas */}
          <div className="space-y-2">
            <Label>音頻波形</Label>
            <canvas
              ref={canvasRef}
              width={450}
              height={100}
              className="w-full border border-gray-200 rounded-lg bg-gray-50"
            />
          </div>

          {/* Recording Time */}
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-gray-900">
              {formatTime(recordingTime)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {recordingState === 'idle' && '按下開始錄音'}
              {recordingState === 'recording' && '錄音中...'}
              {recordingState === 'paused' && '已暫停'}
              {recordingState === 'stopped' && '錄音完成'}
            </p>
          </div>

          {/* Audio Preview (after recording) */}
          {audioUrl && recordingState === 'stopped' && (
            <div className="space-y-2">
              <Label>預覽錄音</Label>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-2">
            {recordingState === 'idle' && (
              <Button onClick={startRecording} className="gap-2" size="lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                開始錄音
              </Button>
            )}

            {recordingState === 'recording' && (
              <>
                <Button onClick={pauseRecording} variant="outline" size="lg" className="gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  暫停
                </Button>
                <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" />
                  </svg>
                  停止
                </Button>
              </>
            )}

            {recordingState === 'paused' && (
              <>
                <Button onClick={resumeRecording} variant="outline" size="lg" className="gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  繼續
                </Button>
                <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" />
                  </svg>
                  停止
                </Button>
              </>
            )}

            {recordingState === 'stopped' && (
              <Button onClick={startRecording} variant="outline" size="lg" className="gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                重新錄製
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          {recordingState === 'stopped' && (
            <Button
              onClick={saveRecording}
              disabled={createNoteMutation.isPending}
              className="gap-2"
            >
              {createNoteMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  儲存中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  儲存錄音
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
