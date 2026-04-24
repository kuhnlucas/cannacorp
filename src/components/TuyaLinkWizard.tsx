import { useState } from 'react';
import { X, ExternalLink, Copy, Check } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import api from '../services/api';

interface TuyaLinkWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TuyaLinkWizard({ isOpen, onClose, onSuccess }: TuyaLinkWizardProps) {
  const { selectedTenant } = useTenant();
  const [step, setStep] = useState(1);
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const tuyaConsoleUrl = import.meta.env.VITE_TUYA_CONSOLE_PROJECT_URL || 'https://iot.tuya.com/';

  const handleCopyUID = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidate = async () => {
    if (!uid.trim()) {
      setError('Por favor ingresa el UID');
      return;
    }

    if (!selectedTenant) {
      setError('No hay organización seleccionada. Por favor crea o selecciona una organización en el selector del header.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.tuya.validateAppAccount(uid.trim());

      // Éxito
      alert(`✅ Vinculación exitosa! Se encontraron ${data.devicesCount} dispositivo(s).`);
      onSuccess();
      onClose();
      setStep(1);
      setUid('');
    } catch (err: any) {
      console.error('Error validating UID:', err);
      setError(err?.message || 'Error de conexión. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setUid('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Vincular Smart Life (Tuya)
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step >= stepNum
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > stepNum ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Consola Tuya</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Escanear QR</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Pegar UID</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Paso 1: Obtener el UID de tu cuenta Smart Life
              </h3>
              
              <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
                  <strong>Cómo obtener el UID:</strong>
                </p>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li>Abre <a href="https://iot.tuya.com/" target="_blank" className="underline font-semibold">Tuya IoT Platform</a></li>
                  <li>
                    <strong>Verifica el Data Center</strong> (esquina superior derecha):
                    <ul className="ml-6 mt-1 space-y-1 text-xs">
                      <li>• Argentina/Chile → <strong>Eastern America</strong></li>
                      <li>• USA/Canadá → <strong>Western America</strong></li>
                      <li>• España/Francia/UK → <strong>Western Europe</strong></li>
                    </ul>
                  </li>
                  <li>Ve a tu <strong>Cloud Project</strong></li>
                  <li>Click en <strong>Devices</strong> (menú lateral)</li>
                  <li>Click en <strong>Link Tuya App Account</strong></li>
                  <li>Click en <strong>Add App Account</strong></li>
                  <li>Verás un QR y debajo el <strong>UID</strong> (ejemplo: ay1234567890abcd)</li>
                  <li>Copia ese UID y pégalo en el paso 2</li>
                </ol>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-500 p-4 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>Importante:</strong> El data center de tu proyecto debe coincidir con el de tu cuenta Smart Life.
                  Si registraste Smart Life desde Argentina/Chile, tu proyecto debe estar en <strong>Eastern America</strong>.
                </p>
              </div>

              <a
                href={tuyaConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir Tuya Developer Platform
              </a>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Paso 2: Escanear QR desde Smart Life
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Abre la app Smart Life en tu teléfono y escanea el código QR que apareció en la consola de Tuya.
              </p>

              <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-900 dark:text-green-100 mb-3">
                  <strong>En la app Smart Life:</strong>
                </p>
                <ol className="list-decimal list-inside text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>Abre Smart Life app</li>
                  <li>Toca el botón <strong>+</strong> (agregar dispositivo)</li>
                  <li>Toca <strong>Scan</strong> o <strong>Escanear</strong></li>
                  <li>Escanea el QR de la consola Tuya</li>
                  <li>Acepta la autorización</li>
                </ol>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  <strong>Importante:</strong> Asegúrate de que el Data Center en tu Cloud Project coincida con la región donde creaste tu cuenta Smart Life (US, EU, CN, IN).
                </p>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Paso 3: Pegar UID
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Copia el UID que aparece en la consola de Tuya (debajo del QR) y pégalo aquí.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  UID de Tuya
                </label>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="ay1234567890abcdef"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  El UID comienza con "ay" seguido de caracteres alfanuméricos
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={loading}
                >
                  Anterior
                </button>
                <button
                  onClick={handleValidate}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={loading || !uid.trim()}
                >
                  {loading ? 'Validando...' : 'Validar y Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
