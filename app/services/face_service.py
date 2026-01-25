import numpy as np
import logging

logger = logging.getLogger(__name__)

# Try importing face_recognition, handle if missing
try:
    import face_recognition
    FACE_LIB_AVAILABLE = True
except ImportError:
    FACE_LIB_AVAILABLE = False
    logger.warning("face_recognition library not found. Face ID features will be disabled.")

class FaceService:
    @staticmethod
    def get_encoding(image_file):
        if not FACE_LIB_AVAILABLE:
            raise ImportError("face_recognition library is not installed.")
        
        try:
            # Load image from file-like object
            image = face_recognition.load_image_file(image_file)
            
            # Find all face encodings in the current image
            encodings = face_recognition.face_encodings(image)
            
            if not encodings:
                return None
                
            # Return the first face found (assuming single person enrollment)
            return encodings[0].tolist() 
        except Exception as e:
            logger.error(f"Error processing face encoding: {e}")
            return None

    @staticmethod
    def compare_faces(known_encodings_list, unknown_encoding, tolerance=0.5):
        """
        Compare a list of known encodings against a single unknown encoding.
        Returns the index of the best match if any, else None.
        Lower tolerance = stricter match (default 0.6, recommended 0.5 for security).
        """
        if not FACE_LIB_AVAILABLE:
            return None

        if not known_encodings_list or not unknown_encoding:
            return None

        try:
            # Convert list of lists to numpy array
            known_encodings = np.array(known_encodings_list)
            unknown_face_encoding = np.array(unknown_encoding)

            # Calculate euclidean distances
            distances = face_recognition.face_distance(known_encodings, unknown_face_encoding)
            
            # Find the best match (smallest distance)
            best_match_index = np.argmin(distances)
            
            if distances[best_match_index] <= tolerance:
                return best_match_index
            
            return None
        except Exception as e:
            logger.error(f"Error comparing faces: {e}")
            return None
