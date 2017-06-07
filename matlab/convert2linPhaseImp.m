function [linPhaseImp] = convert2linPhaseImp(input)

absH = abs(fft(input));
N = length(absH);
n_0 = 0.2*N;
phase_term = exp(-j.*n_0.*(2*pi/N).*(0:N-1))';

linPhaseImp = real(ifft(absH.*phase_term));

end