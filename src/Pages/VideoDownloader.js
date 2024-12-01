import React, { useState } from 'react';
import { Download, Link, Loader2, Video, AlertTriangle } from 'lucide-react';
import Footer from '../Component/Footer';
import Navbar from '../Component/Navbar';

const VideoDownloader = () => {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVideoInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulated video info fetch 
      // In a real-world scenario, replace with an actual video info API
      const mockResponse = {
        title: 'Sample Video Title',
        thumbnail: 'https://via.placeholder.com/640x360',
        formats: [
          { 
            quality: '720p', 
            ext: 'mp4', 
            url: 'https://example.com/video720.mp4',
            filesize: '25.5 MB'
          },
          { 
            quality: '480p', 
            ext: 'mp4', 
            url: 'https://example.com/video480.mp4',
            filesize: '15.2 MB'
          }
        ]
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setVideoInfo(mockResponse);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch video. Please check the URL.');
      setLoading(false);
    }
  };

  const handleDownload = (videoUrl, quality) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `video_${quality}.mp4`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      fetchVideoInfo();
    }
  };

  return (
    <>
    <Navbar/>
     <div className="max-h-full pt-48 pb-16 bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Video Downloader
        </h1>

        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-100">
              <Link className="text-gray-500" />
            </div>
            <input 
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter video URL"
              required
              className="flex-grow p-3 outline-none w-full"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 
              transition-colors flex items-center justify-center
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="mr-2 animate-spin" /> Fetching...</>
            ) : (
              'Get Video Info'
            )}
          </button>
        </form>

        {/* Error Handling */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center">
            <AlertTriangle className="mr-3 text-red-500" />
            {error}
          </div>
        )}

        {/* Video Preview */}
        {videoInfo && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="mb-4 rounded-lg overflow-hidden shadow-md">
              <img 
                src={videoInfo.thumbnail} 
                alt="Video Thumbnail" 
                className="w-full h-48 object-cover"
              />
            </div>

            <h2 className="text-lg font-semibold mb-2 truncate">
              {videoInfo.title}
            </h2>

            <div className="space-y-2">
              {videoInfo.formats.map((format, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                >
                  <div>
                    <span className="font-medium">{format.quality}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {format.ext} • {format.filesize}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(format.url, format.quality)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg 
                      hover:bg-green-600 flex items-center"
                  >
                    <Download className="mr-2 w-4 h-4" /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    <Footer/>
    </>
   

  );
};

export default VideoDownloader;