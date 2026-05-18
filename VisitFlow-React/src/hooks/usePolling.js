import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../services/api';

// Singleton socket instance
const socket = io(SOCKET_URL, { path: '/socket.io', autoConnect: true });

/**
 * Custom hook for real-time data from the API using WebSockets.
 * Retains the name `usePolling` for backward compatibility.
 *
 * @param {Function} fetchFn - Async function that returns data
 * @param {number} intervalMs - If > 0, enables real-time updates (interval is no longer used for polling, just as a flag)
 * @param {Array} deps - Dependencies that trigger a re-fetch
 * @returns {{ data, loading, error, refresh }}
 */
export const usePolling = (fetchFn, intervalMs = 5000, deps = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMountedRef = useRef(true);

    const fetchData = useCallback(async () => {
        try {
            const result = await fetchFn();
            if (isMountedRef.current) {
                setData(result);
                setError(null);
                setLoading(false);
            }
        } catch (err) {
            if (isMountedRef.current) {
                setError(err.message);
                setLoading(false);
            }
        }
    }, [fetchFn]);

    // Initial fetch + socket listener
    useEffect(() => {
        isMountedRef.current = true;
        setLoading(true);
        fetchData();

        let handleDbChange = null;

        if (intervalMs > 0) {
            handleDbChange = (payload) => {
                // When any DB change happens, refetch the data.
                // Later this can be optimized by checking payload.table if passed as parameter.
                fetchData();
            };

            socket.on('db_change', handleDbChange);
        }

        return () => {
            isMountedRef.current = false;
            if (handleDbChange) {
                socket.off('db_change', handleDbChange);
            }
        };
    }, [...deps, intervalMs, fetchData]);

    const refresh = useCallback(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refresh };
};

/**
 * Simple hook for one-time data fetch (no real-time).
 * Use when updates are not needed (e.g., Reports page).
 */
export const useFetch = (fetchFn, deps = []) => {
    return usePolling(fetchFn, 0, deps);
};
