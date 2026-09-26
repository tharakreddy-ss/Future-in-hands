import Foundation
import Vision
import ImageIO
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
let handler = VNImageRequestHandler(url: url)
do {
  try handler.perform([request])
  for observation in request.results ?? [] {
    if let text = observation.topCandidates(1).first?.string { print(text) }
  }
} catch { exit(1) }
