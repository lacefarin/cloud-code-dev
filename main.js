Parse.Cloud.beforeSave("Attachment", async(request) => {
  // Strings
  const contentFieldName = "content"
  const contentTypeFieldName = 'contentType'
  const thumbnailFieldName = "thumbnail"
  const thumbnailName = 'thumb.png'

  // URL of file
  const fileContentUrl = request.object.get(contentFieldName).url()
  // Content type
  const fileContentType = request.object.get(contentTypeFieldName)
  
  // Supported video formats
  const supportedVideoFormats = ['mp4','mov']

  if (supportedVideoFormats.includes(fileContentType)) {
        // Generate thumbnail
        await ffmpegSync(fileContentUrl, thumbnailName).then( (thumbnail) => {
            request.object.set(thumbnailFieldName, thumbnail)
        })
  }
})

function ffmpegSync(inputFileUrl, outputFileName) {

  // Packages
  const ffmpeg = require('fluent-ffmpeg')
  const ffmpeg_static = require('ffmpeg-static')
  const fs = require('fs')

  // Temporary directory for generated thumbnail
  const outputFileDir = './tmp/'

  // Create temporary directory
  if (!fs.existsSync(outputFileDir)) {
    fs.mkdirSync(outputFileDir)
  }

  return new Promise((resolve, reject) => {
    // Input file url
    ffmpeg(inputFileUrl)
    // set ffmpeg path for shell
    .setFfmpegPath(ffmpeg_static)
    // Take screenshot at start(0.0)
    // and make it of size 200x200
    .screenshots({
      timestamps: [0.0],
      filename: outputFileName,
      folder: outputFileDir,
      size: '200x200'
    }).on('end', () => {
      // Read file data from disk
      fs.readFile(outputFileDir + outputFileName, 'base64' , (err, data) => {
        // Generate Parse.File object from data
        let thumbnail = new Parse.File(outputFileName, { base64: data})
        // Save Parse.File
        thumbnail.save().then( () => {
          // Resolve promise with saved Parse.File
          resolve(thumbnail)
        })
      })
    }).on('error', (err) => {
      return reject(new Error(err))
    })
  })
}